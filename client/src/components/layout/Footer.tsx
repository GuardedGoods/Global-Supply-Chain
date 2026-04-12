import { Database, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-8">
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div>
            <h4 className="font-semibold mb-2 text-foreground">Supply Chain Risk</h4>
            <p className="text-muted-foreground">
              Open-source risk intelligence dashboard for supply chain analysts monitoring commodities, logistics, weather, and geopolitical events across North America.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-foreground flex items-center gap-1.5">
              <Database className="h-3 w-3" /> Data Sources
            </h4>
            <ul className="space-y-1 text-muted-foreground">
              <li><a href="https://fred.stlouisfed.org" target="_blank" rel="noopener" className="hover:text-foreground inline-flex items-center gap-1">FRED (Federal Reserve) <ExternalLink className="h-2.5 w-2.5"/></a></li>
              <li><a href="https://www.eia.gov/opendata/" target="_blank" rel="noopener" className="hover:text-foreground inline-flex items-center gap-1">EIA (Energy) <ExternalLink className="h-2.5 w-2.5"/></a></li>
              <li><a href="https://www.weather.gov" target="_blank" rel="noopener" className="hover:text-foreground inline-flex items-center gap-1">NWS (Weather) <ExternalLink className="h-2.5 w-2.5"/></a></li>
              <li><a href="https://www.gdeltproject.org" target="_blank" rel="noopener" className="hover:text-foreground inline-flex items-center gap-1">GDELT (News) <ExternalLink className="h-2.5 w-2.5"/></a></li>
              <li><a href="https://www.frankfurter.app" target="_blank" rel="noopener" className="hover:text-foreground inline-flex items-center gap-1">Frankfurter (FX) <ExternalLink className="h-2.5 w-2.5"/></a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-foreground">Categories</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>Commodities & Energy</li>
              <li>Economic Indicators</li>
              <li>Weather & Disasters</li>
              <li>News & Geopolitics</li>
              <li>Logistics & Freight</li>
              <li>Currency & Trade</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-foreground">About</h4>
            <p className="text-muted-foreground mb-2">
              Self-hosted, open-source. Data refreshed every 15 minutes.
            </p>
            <p className="text-muted-foreground">
              AI-powered analysis via OpenAI. Map tiles by Mapbox.
            </p>
          </div>
        </div>
        <div className="border-t border-border/50 mt-6 pt-4 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>© {new Date().getFullYear()} Supply Chain Risk Dashboard</span>
          <span>All data sourced from public APIs. Not financial advice.</span>
        </div>
      </div>
    </footer>
  );
}
