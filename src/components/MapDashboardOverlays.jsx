import { useState, useMemo } from 'react';
import { Search, Filter, Navigation, Tent, Droplets, MapPin } from 'lucide-react';

const OverlayBox = ({ title, icon: Icon, items, type, onFeatureSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(items.map(i => i.status).filter(Boolean));
    return Array.from(statuses);
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter !== 'All') {
      result = result.filter(i => i.status === statusFilter);
    }
    if (searchQuery) {
      result = result.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [items, searchQuery, statusFilter]);

  return (
    <div 
      className={`bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 rounded shadow-lg overflow-hidden flex flex-col transition-opacity duration-300 pointer-events-auto ${isHovered ? 'opacity-100' : 'opacity-40'} flex-1 min-h-0`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowSearch(false);
        setShowFilter(false);
      }}
    >
      {/* Header */}
      <div className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-200 tracking-tight">{title}</h4>
          <span className="text-[10px] bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full ml-1 font-medium">
            {filteredItems.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div 
            onMouseEnter={() => { setShowSearch(true); setShowFilter(false); }}
            className={`p-1 rounded cursor-default transition-colors ${showSearch ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500'}`}
          >
            <Search className="w-3 h-3" />
          </div>
          <div 
            onMouseEnter={() => { setShowFilter(true); setShowSearch(false); }}
            className={`p-1 rounded cursor-default transition-colors ${showFilter ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500'}`}
          >
            <Filter className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Search Bar (Collapsible) */}
      {showSearch && (
        <div className="px-2 py-1.5 border-b border-gray-100 dark:border-zinc-800 shrink-0 bg-gray-50 dark:bg-zinc-900/50">
          <input 
            type="text" 
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-white outline-none focus:border-blue-500"
            autoFocus
          />
        </div>
      )}

      {/* Filter Bar (Collapsible) */}
      {showFilter && uniqueStatuses.length > 0 && (
        <div className="px-2 py-1.5 border-b border-gray-100 dark:border-zinc-800 shrink-0 bg-gray-50 dark:bg-zinc-900/50 flex flex-wrap gap-1">
          <button 
            onClick={() => setStatusFilter('All')} 
            className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${statusFilter === 'All' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-zinc-700 dark:text-gray-300'}`}
          >
            All
          </button>
          {uniqueStatuses.map(status => (
             <button 
                key={status} 
                onClick={() => setStatusFilter(status)} 
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${statusFilter === status ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-zinc-700 dark:text-gray-300'}`}
             >
                {status}
             </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-600">
        {filteredItems.length === 0 ? (
          <div className="p-2 text-center text-[10px] text-gray-500 dark:text-gray-400 italic">No matches</div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filteredItems.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => onFeatureSelect({ type, name: item.name, district: item.district, ts: Date.now() })}
                className="flex items-start gap-2 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer transition-colors group"
              >
                <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${item.colorClass}`} title={item.status} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                    {item.name}
                  </span>
                  {item.subtitle && (
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function MapDashboardOverlays({ roadsLogs = [], defectLogs = [], ppsData = [], riversData = [], onFeatureSelect, mapMode = 'flood' }) {
  
  // Prepare Roads Data
  const getRoadColorClass = (status) => {
    if (mapMode === 'defects') {
      if (status === 'Ongoing') return 'bg-orange-500';
      return 'bg-green-500';
    } else {
      if (status === 'Closed') return 'bg-red-500';
      if (status === 'Heavy Vehicles Only') return 'bg-yellow-500';
      if (status === 'Pending Assessment') return 'bg-orange-500';
      return 'bg-green-500';
    }
  };

  const processRoads = (district) => {
    if (mapMode === 'defects') {
      return defectLogs
        .filter(log => log.district?.toUpperCase() === district.toUpperCase() && log.status === 'Ongoing')
        .map(log => ({
          name: log.road_name,
          district: log.district,
          status: log.status || 'Ongoing',
          colorClass: getRoadColorClass(log.status || 'Ongoing'),
          subtitle: log.status || 'Ongoing'
        }));
    } else {
      return roadsLogs
        .filter(log => log.district?.toUpperCase() === district.toUpperCase() && ['Closed', 'Heavy Vehicles Only', 'Pending Assessment'].includes(log.status))
        .map(log => ({
          name: log.road_name,
          district: log.district,
          status: log.status,
          colorClass: getRoadColorClass(log.status),
          subtitle: log.status
        }));
    }
  };

  const jbRoads = processRoads('Johor Bahru');
  const ktRoads = processRoads('Kota Tinggi');
  const segamatRoads = processRoads('Segamat');

  // Prepare PPS Data
  const getPpsColorClass = (status) => {
    if (status === 'Active') return 'bg-green-500';
    if (status === 'Standby') return 'bg-blue-500';
    if (status === 'Closed') return 'bg-red-500';
    return 'bg-gray-400';
  };

  const ppsItems = ppsData.map(pps => ({
    name: pps.PPS_Name,
    district: pps.District,
    status: pps.Status,
    colorClass: getPpsColorClass(pps.Status),
    subtitle: `${pps.Status} • ${pps.District}`
  }));

  // Prepare Rivers Data
  const getRiverColorClass = (status) => {
    if (status === 'Danger') return 'bg-red-500';
    if (status === 'Warning') return 'bg-orange-500';
    if (status === 'Alert') return 'bg-yellow-500';
    return 'bg-cyan-500';
  };

  const riverItems = riversData.map(river => ({
    name: river.River_Name,
    district: river.District,
    status: river.Status,
    colorClass: getRiverColorClass(river.Status),
    subtitle: `${river.Status} • ${(river.Water_Level || 0).toFixed(2)}m`
  }));

  return (
    <>
      {/* LEFT SIDE - Districts */}
      <div className="absolute top-3 left-3 bottom-8 z-[400] flex flex-col gap-3 w-56 pointer-events-none">
        <OverlayBox title="Johor Bahru" icon={MapPin} items={jbRoads} type="road" onFeatureSelect={onFeatureSelect} />
        <OverlayBox title="Kota Tinggi" icon={MapPin} items={ktRoads} type="road" onFeatureSelect={onFeatureSelect} />
        <OverlayBox title="Segamat" icon={MapPin} items={segamatRoads} type="road" onFeatureSelect={onFeatureSelect} />
      </div>

      {/* RIGHT SIDE - PPS & Rivers OR Defect Summaries */}
      <div className="absolute top-3 right-3 bottom-8 z-[400] flex flex-col gap-3 w-64 pointer-events-none">
        {mapMode === 'flood' ? (
          <>
            <OverlayBox title="Evacuation Centers (PPS)" icon={Tent} items={ppsItems} type="pps" onFeatureSelect={onFeatureSelect} />
            <OverlayBox title="River Telemetry" icon={Droplets} items={riverItems} type="river" onFeatureSelect={onFeatureSelect} />
          </>
        ) : (
          <>
            <OverlayBox 
              title="Completed Defects (3 Districts)" 
              icon={MapPin} 
              items={defectLogs.filter(log => log.status === 'Completed' && ['Johor Bahru', 'Kota Tinggi', 'Segamat'].includes(log.district)).map(log => ({
                name: log.road_name,
                district: log.district,
                status: log.status,
                colorClass: 'bg-green-500',
                subtitle: log.district || 'Unknown District'
              }))} 
              type="road" 
              onFeatureSelect={onFeatureSelect} 
            />
          </>
        )}
      </div>
    </>
  );
}
