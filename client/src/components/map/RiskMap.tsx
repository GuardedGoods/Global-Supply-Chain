import { useState, useMemo, useEffect } from 'react';
import MapGL, { NavigationControl, ScaleControl, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useThemeContext } from '@/components/layout/ThemeProvider';
import { MapControls } from './MapControls';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { WeatherAlert } from '../../../../shared/types/weather';
import type { PortStatus } from '../../../../shared/types/logistics';

interface RiskMapProps {
  weatherAlerts?: WeatherAlert[];
  ports?: PortStatus[];
  className?: string;
  interactive?: boolean;
}

// Cache the token globally so we only fetch once
let _cachedToken: string | null = null;

function useMapboxToken() {
  const [token, setToken] = useState<string | null>(_cachedToken);
  const [loading, setLoading] = useState(_cachedToken === null);

  useEffect(() => {
    if (_cachedToken !== null) return;
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        _cachedToken = data.mapboxToken || '';
        setToken(_cachedToken);
      })
      .catch(() => {
        _cachedToken = '';
        setToken('');
      })
      .finally(() => setLoading(false));
  }, []);

  return { token, loading };
}

export function RiskMap({ weatherAlerts = [], ports = [], className = '', interactive = true }: RiskMapProps) {
  const { theme } = useThemeContext();
  const { token: MAPBOX_TOKEN, loading: tokenLoading } = useMapboxToken();
  const [viewState, setViewState] = useState({
    longitude: -98.5,
    latitude: 39.8,
    zoom: 3.5,
    pitch: 0,
    bearing: 0,
  });
  const [layers, setLayers] = useState({
    weather: true,
    ports: true,
  });

  const mapStyle = theme === 'dark'
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11';

  const portMarkers = useMemo(() => {
    if (!layers.ports) return null;
    return ports.map((port) => {
      const color = port.congestionLevel === 'Severe' ? '#dc2626'
        : port.congestionLevel === 'High' ? '#ef4444'
        : port.congestionLevel === 'Moderate' ? '#f59e0b'
        : '#22c55e';

      return (
        <Marker key={port.name} longitude={port.lon} latitude={port.lat}>
          <div
            className="w-3 h-3 rounded-full border-2 border-white shadow-lg cursor-pointer"
            style={{ backgroundColor: color }}
            title={`${port.name}: ${port.congestionLevel} congestion`}
          />
        </Marker>
      );
    });
  }, [ports, layers.ports]);

  if (tokenLoading) {
    return (
      <div className={`flex items-center justify-center bg-card rounded-xl border border-border ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`flex items-center justify-center bg-card rounded-xl border border-border ${className}`}>
        <div className="text-center p-8">
          <p className="text-muted-foreground">Map requires MAPBOX_TOKEN</p>
          <p className="text-xs text-muted-foreground mt-1">Add MAPBOX_TOKEN to your .env file</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${className}`}>
      <MapGL
        {...viewState}
        onMove={(evt: { viewState: typeof viewState }) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        interactive={interactive}
      >
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-left" />
        {portMarkers}
      </MapGL>

      <MapControls
        layers={layers}
        onToggleLayer={(layer) => setLayers(prev => ({ ...prev, [layer]: !prev[layer] }))}
        alertCount={weatherAlerts.length}
        portCount={ports.length}
      />

      {/* Alert count overlay */}
      {weatherAlerts.length > 0 && layers.weather && (
        <div className="absolute top-3 left-3 bg-red-500/90 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
          {weatherAlerts.length} Active Alert{weatherAlerts.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
