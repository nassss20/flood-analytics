import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Map, Clock, User, Mail, Navigation, Droplets, Info, Plus } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import DataEntryModal from "../components/DataEntryModal";

export default function Dashboard() {
  // Using the user's new custom dashboard URL
  const dashboardUrl = "https://www.arcgis.com/apps/dashboards/8dfae5c1482242aab53e50ffde6bd405";

  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isEditor } = useAuth();

  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data, error } = await supabase
          .from('submission_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50); // Get last 50 logs

        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setIsLoadingLogs(false);
      }
    }

    fetchLogs();

    // Set up realtime subscription to listen for new logs
    const subscription = supabase
      .channel('public:submission_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submission_logs' }, payload => {
        setLogs(current => [payload.new, ...current].slice(0, 50));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Filter logs locally
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.road_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
    
    // Convert timestamp to YYYY-MM-DD for date comparison
    let matchesDate = true;
    if (dateFilter) {
      const logDate = log.created_at ? log.created_at.substring(0, 10) : '';
      matchesDate = logDate === dateFilter;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full flex flex-col gap-4"
    >
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Live flood status and road accessibility in Segamat, Johor.</p>
        </div>
      </div>

      <div className="w-full flex-1 min-h-[750px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden relative">
        {/* Loading State Behind Iframe */}
        <div className="absolute inset-0 bg-gray-50 dark:bg-zinc-900/50 flex flex-col items-center justify-center -z-10">
          <Map className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3 animate-pulse" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Map Data...</p>
        </div>
        
        <iframe 
          src={dashboardUrl}
          className="w-full h-full border-none z-10 absolute inset-0"
          title="ArcGIS Dashboard"
          allowFullScreen
        />
      </div>

      {/* Audit Logs Section */}
      <div className="w-full mt-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Data Entry History
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recent flood status updates submitted through the portal.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Live Sync</span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Search by road name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full sm:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Open for Heavy Vehicles Only">Open for Heavy Vehicles Only</option>
              <option value="Closed">Closed</option>
              <option value="Pending Assessment">Pending Assessment</option>
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(searchQuery || statusFilter !== 'All' || dateFilter) && (
            <div className="w-full sm:w-auto flex items-center">
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setDateFilter('');
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-zinc-800/50 dark:text-gray-300">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Timestamp</th>
                <th scope="col" className="px-6 py-4 font-semibold">Road Name</th>
                <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                <th scope="col" className="px-6 py-4 font-semibold">Depth (m)</th>
                <th scope="col" className="px-6 py-4 font-semibold">Submitted By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800/80">
              {isLoadingLogs ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading history...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Info className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                    <p className="text-base font-medium text-gray-900 dark:text-white">No entries found</p>
                    <p className="mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-300 font-medium">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                        <Navigation className="w-4 h-4 text-cyan-500" />
                        {log.road_name}
                      </div>
                      {log.district && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-6">
                          District: {log.district}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        log.status === 'Open' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                        log.status === 'Closed' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                        log.status === 'Open for Heavy Vehicles Only' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
                        'bg-gray-50 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700'
                      }`}>
                        {log.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.depth !== null ? (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                          <Droplets className="w-4 h-4" />
                          {log.depth}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-900 dark:text-white font-medium text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          {log.submitted_by_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
                          <Mail className="w-3.5 h-3.5" />
                          {log.submitted_by_email}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, filteredLogs.length)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{filteredLogs.length}</span> entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="px-2 text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button for Editors/Admins */}
      {isEditor && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg shadow-blue-900/20 flex items-center gap-2 group transition-colors"
        >
          <Plus className="w-6 h-6" />
          <span className="font-semibold pr-2 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">
            Update Road
          </span>
        </motion.button>
      )}

      {/* Data Entry Modal */}
      <DataEntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </motion.div>
  );
}
