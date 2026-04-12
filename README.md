# Global Supply Chain Risk Dashboard

Open-source, self-hostable supply chain risk intelligence dashboard focused on **North America** and **CPG companies** (cereal, pet food, peanut butter, packaged goods). Aggregates free public data, generates AI-powered risk assessments, and ships as a single Docker image you can run on a NAS.

## What it does

Gives a solo analyst or small team a one-pane-of-glass view across eight risk dimensions, refreshed every 15 minutes:

- **Executive Overview** — composite risk score, AI-generated holistic assessment, KPI cards, watchlist, CPG scenario modeler
- **Interactive Risk Map** — Mapbox-powered North America map with port congestion + weather overlays
- **Commodities & Pricing** — agricultural (wheat, corn, oats, peanuts, soy, sugar, rice), energy (WTI, diesel, gasoline), packaging (pulp, paper, boxes, plastic resin), metals (steel, aluminum)
- **Economic Indicators** — GDP, CPI, unemployment, Fed funds, yield spread, PPI
- **News & Geopolitics** — GDELT-sourced supply chain news with sentiment analysis and CPG-focused category filters (FDA, USMCA, tariffs, recalls, freight)
- **Logistics & Transportation** — port congestion for major NA ports, freight indicators
- **Weather & Natural Disasters** — live NWS alerts + forecasts for 10 major logistics hubs
- **Currency & Trade** — USD rates for CAD, MXN, EUR, GBP, JPY, CNY with 30-day history

### Analyst features

- **Watchlists** — bookmark any commodity or currency pair, threshold alerts (localStorage, no account)
- **Scenario Modeler** — apply price shocks to commodity baskets, see weighted COGS impact with pre-built CPG templates (Cereal / Pet Food / Peanut Butter)
- **CSV Export** — download any category as CSV for offline analysis
- **Density Toggle** — comfortable / compact layouts for executive vs analyst view
- **Dark + Light Modes**

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS with custom design tokens |
| Fonts | Inter Tight (UI), IBM Plex Mono (numerics, tabular) |
| Maps | Mapbox GL JS + react-map-gl |
| Charts | Recharts |
| Backend | Node.js + Express + TypeScript |
| Cache | SQLite (better-sqlite3), 15-min TTL |
| AI | OpenAI gpt-4o-mini |
| Real-time | Server-Sent Events |
| Security | helmet CSP, express-rate-limit, non-root Docker user |
| Tests | Vitest (server + client) |
| Container | Docker multi-stage build |

## Architecture

```
┌─────────────────┐        ┌─────────────────────┐
│  Public APIs    │        │  OpenAI API         │
│  FRED, EIA, NWS,│        │  (gpt-4o-mini)      │
│  GDELT, FX      │        └──────────┬──────────┘
└────────┬────────┘                   │
         │ every 15 min               │ on-demand
         ▼                            ▼
┌─────────────────────────────────────────────┐
│   Express Server (port 9049)                │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │Collectors│→ │ SQLite   │→ │  Routes  │  │
│   │ (cron)   │  │  Cache   │  │(REST+SSE)│  │
│   └──────────┘  └──────────┘  └─────┬────┘  │
│   ┌──────────────────────────┐      │       │
│   │ Risk Assessment Service  │◄─────┘       │
│   │ (aggregates + OpenAI)    │              │
│   └──────────────────────────┘              │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
            ┌────────────────────┐
            │  React SPA         │
            │  Watchlist (local) │
            │  Scenario Modeler  │
            │  8 dashboard pages │
            └────────────────────┘
```

## Quick Start (Docker on Synology NAS)

### 1. Get API keys

| Key | Required | Free | Where |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | Pay-per-use | https://platform.openai.com/api-keys |
| `FRED_API_KEY` | Yes | ✓ | https://fred.stlouisfed.org/docs/api/api_key.html |
| `EIA_API_KEY` | Yes | ✓ | https://www.eia.gov/opendata/register.php |
| `MAPBOX_TOKEN` | Yes | ✓ (50K/mo) | https://account.mapbox.com/access-tokens/ |
| `NEWSAPI_KEY` | No | ✓ | https://newsapi.org/register |

APIs that require **no key**: NWS, Open-Meteo, GDELT, Frankfurter.

### 2. Synology Container Manager

1. Project → Create, name it `supply-chain-dashboard`
2. Paste this `docker-compose.yml`:

```yaml
version: '3.8'
services:
  supply-chain-dashboard:
    image: ghcr.io/guardedgoods/global-supply-chain:latest
    container_name: global
    ports:
      - "9049:9049"
    env_file:
      - .env
    volumes:
      - dashboard-data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:9049/api/health"]
      interval: 60s
      timeout: 10s
      retries: 3

volumes:
  dashboard-data:
```

3. Create `.env` in the project folder (see `.env.example` for all options):

```
OPENAI_API_KEY=sk-...
FRED_API_KEY=...
EIA_API_KEY=...
MAPBOX_TOKEN=pk...
PORT=9049
```

4. Build & Start → visit `http://your-nas-ip:9049`

### 3. Updates

`Container Manager → Project → global → Action → Build` pulls the latest image published by the `docker-publish` GitHub Action.

## Security

- **helmet** sets CSP (tuned for Mapbox), X-Frame-Options, X-Content-Type-Options
- **CORS** restricted via `ALLOWED_ORIGINS` env var (backwards-compat: allows all if unset)
- **Rate limiting** — 10 req/15min on AI endpoints, 300 req/15min on other API routes
- **Non-root** container user
- **No secrets in image** — all config via `.env`
- **Collector retry** — exponential backoff (2s, 8s) on API failures before falling back to cached data
- **Startup validation** — config banner prints which API keys are configured and which are missing

## Development

```bash
npm install
npm run dev        # client + server concurrently
npm run build      # production build
npm test -w server # run server tests
npm test -w client # run client tests
npm start          # start built server
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check + per-collector status |
| `GET /api/config` | Public runtime config (Mapbox token) |
| `GET /api/commodities` | Commodity prices + history |
| `GET /api/economic` | Economic indicators |
| `GET /api/weather` | NWS alerts + forecasts |
| `GET /api/news` | GDELT-sourced articles |
| `GET /api/logistics` | Port congestion + freight |
| `GET /api/currency` | FX rates + history |
| `GET /api/summary` | AI executive summary |
| `GET /api/risk-assessment` | Holistic AI risk report |
| `GET /api/stream` | SSE real-time updates |
| `GET /api/export/:category.csv` | CSV export per category |

## License

MIT. All data sourced from public APIs. Not financial advice.
