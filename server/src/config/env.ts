import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  openaiKey: string | null;
  fredKey: string | null;
  eiaKey: string | null;
  mapboxToken: string | null;
  newsApiKey: string | null;
  allowedOrigins: string[];
}

function readKey(name: string): string | null {
  const value = process.env[name];
  if (value && value.trim().length > 0) return value.trim();
  return null;
}

function formatLine(
  symbol: string,
  keyName: string,
  statusText: string
): string {
  const paddedKey = keyName.padEnd(22, ' ');
  return `   ${symbol} ${paddedKey} ${statusText}`;
}

function loadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = parseInt(process.env.PORT || '9049', 10);

  const openaiKey = readKey('OPENAI_API_KEY');
  const fredKey = readKey('FRED_API_KEY');
  const eiaKey = readKey('EIA_API_KEY');
  const mapboxToken = readKey('MAPBOX_TOKEN');
  const newsApiKey = readKey('NEWSAPI_KEY');

  const allowedOriginsRaw = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsRaw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Log warnings for missing optional keys
  if (!openaiKey) {
    console.warn(
      '[config] OPENAI_API_KEY is not set — AI summaries will be disabled.'
    );
  }
  if (!fredKey) {
    console.warn(
      '[config] FRED_API_KEY is not set — commodities and economic data will be limited.'
    );
  }
  if (!eiaKey) {
    console.warn(
      '[config] EIA_API_KEY is not set — fuel price data will be unavailable.'
    );
  }
  if (!mapboxToken) {
    console.warn(
      '[config] MAPBOX_TOKEN is not set — interactive map will be disabled.'
    );
  }

  // Startup banner
  const bannerLine =
    '═══════════════════════════════════════════';
  const lines: string[] = [];
  lines.push(bannerLine);
  lines.push(' Supply Chain Risk Dashboard');
  lines.push(bannerLine);
  lines.push(` Environment:   ${nodeEnv}`);
  lines.push(` Port:          ${port}`);
  lines.push('');
  lines.push(' API Keys:');
  lines.push(
    formatLine(
      openaiKey ? '✓' : '✗',
      'OPENAI_API_KEY',
      openaiKey ? '(AI summaries enabled)' : '(AI summaries DISABLED)'
    )
  );
  lines.push(
    formatLine(
      fredKey ? '✓' : '✗',
      'FRED_API_KEY',
      fredKey
        ? '(commodities + economic enabled)'
        : '(commodities + economic DISABLED)'
    )
  );
  lines.push(
    formatLine(
      eiaKey ? '✓' : '✗',
      'EIA_API_KEY',
      eiaKey ? '(fuel prices enabled)' : '(fuel prices DISABLED)'
    )
  );
  lines.push(
    formatLine(
      mapboxToken ? '✓' : '✗',
      'MAPBOX_TOKEN',
      mapboxToken ? '(map enabled)' : '(map DISABLED)'
    )
  );
  lines.push(
    formatLine(
      newsApiKey ? '✓' : '○',
      'NEWSAPI_KEY',
      newsApiKey
        ? '(NewsAPI enabled)'
        : '(optional - GDELT used instead)'
    )
  );
  lines.push(bannerLine);

  console.log(lines.join('\n'));

  return {
    port,
    nodeEnv,
    openaiKey,
    fredKey,
    eiaKey,
    mapboxToken,
    newsApiKey,
    allowedOrigins,
  };
}

export const config = loadConfig();
