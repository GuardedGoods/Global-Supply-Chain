import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/env';
import { getDb, closeDb } from './db/schema';
import { startScheduler, stopScheduler } from './collectors/scheduler';
import { cacheService } from './services/cache.service';
import { commoditiesRouter } from './routes/commodities';
import { economicRouter } from './routes/economic';
import { weatherRouter } from './routes/weather';
import { newsRouter } from './routes/news';
import { logisticsRouter } from './routes/logistics';
import { currencyRouter } from './routes/currency';
import { summaryRouter } from './routes/summary';
import { riskAssessmentRouter } from './routes/risk-assessment';
import { sseRouter } from './routes/sse';
import { exportRouter } from './routes/export';

const app = express();
const PORT = config.port;

// Security headers with CSP tuned for Mapbox
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://api.mapbox.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://api.mapbox.com'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.mapbox.com',
          'https://*.tiles.mapbox.com',
        ],
        connectSrc: [
          "'self'",
          'https://*.mapbox.com',
          'https://events.mapbox.com',
        ],
        workerSrc: ["'self'", 'blob:'],
        childSrc: ['blob:'],
      },
    },
  })
);

// Restricted CORS: if ALLOWED_ORIGINS is set, only those origins are allowed.
// Otherwise, allow all (backwards compat).
app.use(
  cors({
    origin: config.allowedOrigins.length > 0 ? config.allowedOrigins : true,
  })
);
app.use(express.json());

// ── Rate limiters ─────────────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many AI requests — please try again later.',
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests — please try again later.',
  },
});

// Apply the global API limiter to all /api routes first.
app.use('/api', apiLimiter);

// Stricter limiter for AI endpoints — applied BEFORE the route handlers.
app.use('/api/summary', aiLimiter);
app.use('/api/risk-assessment', aiLimiter);

// API Routes
app.use('/api/commodities', commoditiesRouter);
app.use('/api/economic', economicRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/news', newsRouter);
app.use('/api/logistics', logisticsRouter);
app.use('/api/currency', currencyRouter);
app.use('/api/summary', summaryRouter);
app.use('/api/risk-assessment', riskAssessmentRouter);
app.use('/api/stream', sseRouter);
app.use('/api/export', exportRouter);

// ── Health check ─────────────────────────────────────────────────────────
interface CollectorHealth {
  lastSuccess: string | null;
  hasData: boolean;
}

const COLLECTOR_KEYS = [
  'commodities',
  'economic',
  'weather',
  'news',
  'currency',
  'logistics',
] as const;

type CollectorKey = (typeof COLLECTOR_KEYS)[number];

function readCollectorHealth(key: CollectorKey): CollectorHealth {
  try {
    const cached = cacheService.get<{ lastUpdated?: string } | null>(key);
    if (cached) {
      const lastUpdated =
        typeof cached.lastUpdated === 'string' ? cached.lastUpdated : null;
      return { lastSuccess: lastUpdated, hasData: true };
    }
  } catch (err) {
    console.warn(`[health] Cache read error for ${key}:`, err);
  }
  return { lastSuccess: null, hasData: false };
}

app.get('/api/health', (_req, res) => {
  const collectors = COLLECTOR_KEYS.reduce(
    (acc, key) => {
      acc[key] = readCollectorHealth(key);
      return acc;
    },
    {} as Record<CollectorKey, CollectorHealth>
  );

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    collectors,
  });
});

// Public config endpoint (exposes non-secret env vars to the client)
app.get('/api/config', (_req, res) => {
  res.json({
    mapboxToken: config.mapboxToken || '',
  });
});

// Serve static React build in production
if (config.nodeEnv === 'production') {
  const clientPath = path.resolve('/app/client/dist');
  app.use(express.static(clientPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Initialize database
getDb();

// Start data collection scheduler
startScheduler();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Supply Chain Dashboard running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  stopScheduler();
  closeDb();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  stopScheduler();
  closeDb();
  server.close(() => process.exit(0));
});
