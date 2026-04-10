import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { getDb, closeDb } from './db/schema';
import { startScheduler, stopScheduler } from './collectors/scheduler';
import { commoditiesRouter } from './routes/commodities';
import { economicRouter } from './routes/economic';
import { weatherRouter } from './routes/weather';
import { newsRouter } from './routes/news';
import { logisticsRouter } from './routes/logistics';
import { currencyRouter } from './routes/currency';
import { summaryRouter } from './routes/summary';
import { riskAssessmentRouter } from './routes/risk-assessment';
import { sseRouter } from './routes/sse';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '9049', 10);

app.use(cors());
app.use(express.json());

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public config endpoint (exposes non-secret env vars to the client)
app.get('/api/config', (_req, res) => {
  res.json({
    mapboxToken: process.env.MAPBOX_TOKEN || '',
  });
});

// Serve static React build in production
if (process.env.NODE_ENV === 'production') {
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
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
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
