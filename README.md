# Global Supply Chain Risk Dashboard

A comprehensive, real-time supply chain risk monitoring dashboard that aggregates data from multiple free APIs to provide executive-level visibility into logistics risks, commodity prices, economic indicators, weather events, news, and geopolitical developments.

## Features

- **Executive Overview** - KPI cards, AI-powered risk assessment, and composite risk scoring
- **Interactive Risk Map** - Mapbox GL-powered map with weather alerts, port congestion, and transportation overlays
- **Commodities & Pricing** - Real-time commodity prices (agricultural, energy, metals) with historical charts
- **Economic Indicators** - GDP, CPI, unemployment, Fed funds rate, and other key metrics
- **News & Geopolitical** - Supply chain news aggregation with AI-generated summaries and sentiment analysis
- **Logistics & Transportation** - Port congestion monitoring, freight indicators, and disruption tracking
- **Weather & Natural Disasters** - Active NWS alerts and forecasts for major logistics hubs
- **Currency & Trade** - Exchange rate monitoring for major trading partners
- **AI Risk Assessment** - OpenAI-powered holistic risk analysis across all data categories
- **Dark/Light Mode** - Toggle between themes

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **UI**: Shadcn/UI + Tremor
- **Maps**: Mapbox GL JS + react-map-gl
- **Charts**: Recharts
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (better-sqlite3) for caching
- **AI**: OpenAI API (gpt-4o-mini)
- **Real-time**: Server-Sent Events (SSE)
- **Container**: Docker

## Quick Start (Docker)

### 1. Create `.env` file

```bash
OPENAI_API_KEY=sk-your-openai-key
FRED_API_KEY=your-fred-api-key
EIA_API_KEY=your-eia-api-key
MAPBOX_TOKEN=pk.your-mapbox-token
NEWSAPI_KEY=your-newsapi-key  # Optional
PORT=9049
```

### 2. Deploy with Docker Compose

```bash
docker compose up -d --build
```

Dashboard will be available at `http://localhost:9049`

### NAS Deployment (Synology Container Manager)

1. Create a project in Container Manager
2. Set the project folder
3. Use this `docker-compose.yml`:

```yaml
services:
  supply-chain-dashboard:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "9049:9049"
    env_file:
      - .env
    volumes:
      - dashboard-data:/app/data
    restart: unless-stopped

volumes:
  dashboard-data:
```

4. Create a `.env` file in the project folder with your API keys
5. Start the project

## API Keys Required

| Key | Required | Where to Get | Cost |
|-----|----------|-------------|------|
| `OPENAI_API_KEY` | Yes | [OpenAI](https://platform.openai.com/api-keys) | Pay-per-use |
| `FRED_API_KEY` | Yes | [FRED](https://fred.stlouisfed.org/docs/api/api_key.html) | Free |
| `EIA_API_KEY` | Yes | [EIA](https://www.eia.gov/opendata/register.php) | Free |
| `MAPBOX_TOKEN` | Yes | [Mapbox](https://account.mapbox.com/access-tokens/) | Free (50K loads/mo) |
| `NEWSAPI_KEY` | No | [NewsAPI](https://newsapi.org/register) | Free tier |

## Data Sources

- **FRED** (Federal Reserve) - Commodity prices, economic indicators
- **EIA** (Energy Information Administration) - Fuel prices
- **NWS** (National Weather Service) - Weather alerts (no key needed)
- **Open-Meteo** - Weather forecasts (no key needed)
- **GDELT** - Global news and geopolitical events (no key needed)
- **Frankfurter** - Currency exchange rates (no key needed)

## Development

```bash
# Install dependencies
npm install

# Run dev servers (client + server concurrently)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Auto-Refresh

Data automatically refreshes every 15 minutes via background collectors. Connected clients receive real-time updates through SSE.