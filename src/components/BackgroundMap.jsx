import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from 'next-themes';
import 'leaflet/dist/leaflet.css';

// Remove default leaflet icon styles since we use custom ones
delete L.Icon.Default.prototype._getIconUrl;

// Focus only on the 3 core districts
const coreLocations = [
  { id: 'segamat', pos: [2.5146, 102.8158], zoom: 10, name: 'Segamat Sector' },
  { id: 'kt', pos: [1.7335, 103.8992], zoom: 10, name: 'Kota Tinggi Sector' },
  { id: 'jb', pos: [1.4927, 103.7414], zoom: 10, name: 'Johor Bahru Sector' }
];

// Telemetry line connecting the nodes
const polylinePath = coreLocations.map(loc => loc.pos);

// Create a sharp, fintech-style data node icon
const createDataNodeIcon = (color = 'blue', isDark = true) => {
  const outerBorder = color === 'blue'
    ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]'
    : 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]';
  const innerFill = color === 'blue' ? 'bg-blue-500' : 'bg-cyan-400';

  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 group">
        <!-- Radar ping -->
        <div class="absolute inset-0 border-[1px] animate-sonar-ping opacity-60 ${outerBorder}"></div>
        <!-- Outer tech bracket -->
        <div class="absolute inset-0 border-[1px] opacity-80 ${outerBorder} transform rotate-45"></div>
        <!-- Inner solid core -->
        <div class="w-2 h-2 ${innerFill} shadow-lg z-10"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Component to handle the camera animation logic
const MapAnimator = () => {
  const map = useMap();

  useEffect(() => {
    let currentIndex = 0;
    let timeoutId;

    const moveToNextLocation = () => {
      const loc = coreLocations[currentIndex];

      // Smoothly fly to the next location
      map.flyTo(loc.pos, loc.zoom, {
        animate: true,
        duration: 3.5,
        easeLinearity: 0.1
      });

      // Move to next index, loop back to start
      currentIndex = (currentIndex + 1) % coreLocations.length;

      // Wait for flight to finish, pause, then fly again
      timeoutId = setTimeout(moveToNextLocation, 10000); // 10 second cycle per node
    };

    timeoutId = setTimeout(moveToNextLocation, 2000);

    return () => clearTimeout(timeoutId);
  }, [map]);

  return null;
};

export default function BackgroundMap() {
  const [weatherData, setWeatherData] = useState({});
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch live weather for the 3 nodes
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=2.5147,1.7335,1.4927&longitude=102.8158,103.8992,103.7414&current_weather=true");
        if (res.ok) {
          const data = await res.json();
          setWeatherData({
            segamat: { temp: data[0].current_weather.temperature, wind: data[0].current_weather.windspeed },
            kt: { temp: data[1].current_weather.temperature, wind: data[1].current_weather.windspeed },
            jb: { temp: data[2].current_weather.temperature, wind: data[2].current_weather.windspeed }
          });
        }
      } catch (err) {
        console.error("Failed to fetch map weather telemetry", err);
      }
    };
    fetchWeather();
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="fixed inset-0 w-full h-full -z-20 bg-gray-100 dark:bg-[#0c0d12] pointer-events-auto overflow-hidden group/map">

      {/* Subtle scanline overlay for the fintech feel */}
      <div className={`absolute inset-0 z-10 pointer-events-none opacity-[0.03] bg-[length:100%_4px] ${isDark ? 'bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)]' : 'bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)]'}`} />

      <MapContainer
        center={[2.0, 103.3]}
        zoom={8}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        attributionControl={false}
        className="w-screen h-screen opacity-30"
      >
        <TileLayer
          key={isDark ? 'dark' : 'light'}
          url={isDark
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          }
        />

        <MapAnimator />

        {/* Telemetry data flow line */}
        <Polyline
          positions={polylinePath}
          pathOptions={{ color: '#0ea5e9', weight: 2, dashArray: '5, 10', opacity: 0.6 }}
          className="animate-pulse"
        />

        {/* Nodes and Tooltips */}
        {coreLocations.map((loc, idx) => (
          <Marker
            key={loc.id}
            position={loc.pos}
            icon={createDataNodeIcon(idx % 2 === 0 ? 'blue' : 'cyan', isDark)}
          >
            <Tooltip
              direction="top"
              offset={[0, -15]}
              opacity={1}
              permanent={false}
              className="bg-white dark:bg-zinc-950 border-2 border-blue-500 rounded-none text-gray-900 dark:text-white font-sans text-xs p-2 shadow-2xl before:hidden after:hidden"
            >
              <div className="flex flex-col gap-1 min-w-[120px]">
                <div className="flex justify-between items-center pb-1 border-b border-gray-200 dark:border-zinc-800">
                  <span className="font-display tracking-widest text-gray-500 dark:text-zinc-400 uppercase text-[10px]">Node</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{loc.name}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-500 dark:text-zinc-500">TEMP</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400">
                    {weatherData[loc.id] ? `${weatherData[loc.id].temp}°C` : '--'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-zinc-500">WIND</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {weatherData[loc.id] ? `${weatherData[loc.id].wind}km/h` : '--'}
                  </span>
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div >
  );
}
