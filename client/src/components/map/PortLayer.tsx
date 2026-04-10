import type { PortStatus } from '../../../../shared/types/logistics';

interface PortLayerProps {
  ports: PortStatus[];
  visible: boolean;
}

export function PortLayer({ ports, visible }: PortLayerProps) {
  if (!visible || ports.length === 0) return null;

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'Severe': return '#dc2626';
      case 'High': return '#ef4444';
      case 'Moderate': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  return (
    <>
      {ports.map((port) => (
        <div
          key={port.name}
          className="absolute"
          style={{
            left: `${((port.lon + 180) / 360) * 100}%`,
            top: `${((90 - port.lat) / 180) * 100}%`,
          }}
        >
          <div
            className="w-3 h-3 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ backgroundColor: getCongestionColor(port.congestionLevel) }}
            title={`${port.name}\nCongestion: ${port.congestionLevel}\nWait: ${port.avgWaitDays} days\nVessels: ${port.vesselCount}`}
          />
        </div>
      ))}
    </>
  );
}
