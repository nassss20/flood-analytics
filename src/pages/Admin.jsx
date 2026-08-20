import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Trash2, Users, AlertTriangle, CheckCircle2, AlertCircle, User, Mail } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { fetchRoads, fetchRivers, updateFeatureStatus } from '../lib/arcgisClient';

export default function Admin() {
  const [logs, setLogs] = useState([]);
  const [roles, setRoles] = useState([]);

  // Tabs for Logs
  const [activeLogTab, setActiveLogTab] = useState('roads'); // 'roads', 'rivers', 'pps'
  
  const [riverLogs, setRiverLogs] = useState([]);
  const [ppsLogs, setPpsLogs] = useState([]);
  const [rivers, setRivers] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  
  // Custom delete modal state
  const [logToDelete, setLogToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter state for logs
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  
  // Pagination state for logs
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;
  
  // We need to fetch roads to map road_name to OBJECTID when undoing
  const [roads, setRoads] = useState([]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Fetch logs
        const { data: logsData, error: logsError } = await supabase
          .from('submission_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (logsError) throw logsError;
        setLogs(logsData || []);

        const { data: riverData, error: riverError } = await supabase
          .from('river_submission_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (riverError) throw riverError;
        setRiverLogs(riverData || []);

        const { data: ppsData, error: ppsError } = await supabase
          .from('pps_supplies')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(100);
        
        if (ppsError) throw ppsError;
        setPpsLogs(ppsData || []);

        // Fetch user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (rolesError) throw rolesError;
        setRoles(rolesData || []);

        // Fetch ArcGIS roads for mapping
        const arcgisRoads = await fetchRoads();
        setRoads(arcgisRoads);
        const arcgisRivers = await fetchRivers();
        setRivers(arcgisRivers);

      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter logs locally
  const getActiveLogs = () => {
    if (activeLogTab === 'roads') return logs;
    if (activeLogTab === 'rivers') return riverLogs;
    return ppsLogs;
  };
  
  const filteredLogs = getActiveLogs().filter(log => {
    const searchTarget = activeLogTab === 'roads' ? log.road_name : 
                         activeLogTab === 'rivers' ? log.river_name : 
                         log.pps_name;
    const matchesSearch = searchTarget?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const logStatus = activeLogTab === 'pps' ? 'All' : log.status; // Disable status filter for PPS or handle differently
    const matchesStatus = statusFilter === 'All' || logStatus === statusFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const dateStr = log.created_at || log.updated_at;
      const logDate = dateStr ? dateStr.substring(0, 10) : '';
      matchesDate = logDate === dateFilter;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

  const showStatus = (type, msg) => {
    setStatus(type);
    setStatusMsg(msg);
    setTimeout(() => setStatus(null), 4000);
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      setRoles(roles.map(r => r.user_id === userId ? { ...r, role: newRole } : r));
      showStatus('success', 'User role updated successfully');
    } catch (err) {
      console.error(err);
      showStatus('error', err.message);
    }
  };

  const executeDeleteLog = async () => {
    if (!logToDelete) return;
    
    setIsDeleting(true);

    try {
      const log = logToDelete;
      
      if (activeLogTab === 'roads') {
        const targetRoad = roads.find(r => r.Name === log.road_name);
        if (!targetRoad) throw new Error("Could not find this road in ArcGIS to revert the status.");

        const { data: previousLogs, error: prevError } = await supabase
          .from('submission_logs')
          .select('*').eq('road_name', log.road_name).neq('id', log.id).order('created_at', { ascending: false }).limit(1);
        if (prevError) throw prevError;

        let attributesToRevert = { DEPTH: null, Status: null, DAMAGE: null };
        if (previousLogs && previousLogs.length > 0) {
          const prev = previousLogs[0];
          attributesToRevert = { DEPTH: prev.depth, Status: prev.status, DAMAGE: prev.damage };
        }
        await updateFeatureStatus(targetRoad.layerId, targetRoad.OBJECTID, attributesToRevert);
        
        const { error: deleteError } = await supabase.from('submission_logs').delete().eq('id', log.id);
        if (deleteError) throw deleteError;
        
        setLogs(logs.filter(l => l.id !== log.id));
        showStatus('success', `Log deleted and ArcGIS map reverted for ${log.road_name}`);
      
      } else if (activeLogTab === 'rivers') {
        const targetRiver = rivers.find(r => r.River_Name === log.river_name);
        if (!targetRiver) throw new Error("Could not find this river in ArcGIS to revert the status.");

        const { data: previousLogs, error: prevError } = await supabase
          .from('river_submission_logs')
          .select('*').eq('river_name', log.river_name).neq('id', log.id).order('created_at', { ascending: false }).limit(1);
        if (prevError) throw prevError;

        let attributesToRevert = { Status: null, Water_Level: null };
        if (previousLogs && previousLogs.length > 0) {
          const prev = previousLogs[0];
          attributesToRevert = { Status: prev.status, Water_Level: prev.water_level };
        }
        await updateFeatureStatus(targetRiver.layerId, targetRiver.OBJECTID, attributesToRevert);
        
        const { error: deleteError } = await supabase.from('river_submission_logs').delete().eq('id', log.id);
        if (deleteError) throw deleteError;
        
        setRiverLogs(riverLogs.filter(l => l.id !== log.id));
        showStatus('success', `Log deleted and ArcGIS map reverted for ${log.river_name}`);
      
      } else if (activeLogTab === 'pps') {
        const { error: deleteError } = await supabase.from('pps_supplies').delete().eq('id', log.id);
        if (deleteError) throw deleteError;
        
        setPpsLogs(ppsLogs.filter(l => l.id !== log.id));
        showStatus('success', `Log deleted successfully for ${log.pps_name}`);
      }

    } catch (err) {
      console.error(err);
      showStatus('error', err.message);
    } finally {
      setIsDeleting(false);
      setLogToDelete(null);
    }
  };


  return (
    <div className="w-full max-w-5xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="text-blue-600 dark:text-blue-400" />
          Admin Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage user roles and audit logs. Changes here are destructive.</p>
      </div>

      <AnimatePresence>
        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">{statusMsg}</span>
          </motion.div>
        )}
        
        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-sm font-medium text-red-800 dark:text-red-300">{statusMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-8">
        
        {/* User Roles Section */}
        <section className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Role Management
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-zinc-800/50 dark:text-gray-300">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">User ID</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Username</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Role</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800/80">
                {isLoading ? (
                  <tr><td colSpan="4" className="p-6 text-center">Loading...</td></tr>
                ) : roles.map((role) => (
                  <tr key={role.id} className="bg-white dark:bg-zinc-900">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{role.user_id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{role.username || role.email || '-'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={role.role}
                        onChange={(e) => handleUpdateRole(role.user_id, e.target.value)}
                        disabled={role.user_id === '0875d7d7-3878-40df-9fe6-30a853c677a1'}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="viewer">Viewer (Read-only)</option>
                        <option value="editor_jkr">Editor (JKR) - Road Only</option>
                        <option value="editor_jkm">Editor (JKM) - PPS Only</option>
                        <option value="editor_jps">Editor (JPS) - Water Level Only</option>
                        <option value="editor">Editor (All)</option>
                        <option value="admin">Admin (Full Access)</option>
                        <option value="banned">Banned (No Access)</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Auto-saved</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Logs Deletion Section */}
        <section className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-red-50/30 dark:bg-red-900/10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Manage Submissions (Danger Zone)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Deleting a log will automatically revert the ArcGIS map to the road's previous state.</p>
            
            <div className="flex gap-4 mt-6 border-b border-gray-200 dark:border-zinc-800 pb-0">
              <button 
                onClick={() => { setActiveLogTab('roads'); setCurrentPage(1); }}
                className={`text-sm font-medium px-4 py-2 border-b-2 transition-colors ${activeLogTab === 'roads' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                Road Logs
              </button>
              <button 
                onClick={() => { setActiveLogTab('rivers'); setCurrentPage(1); }}
                className={`text-sm font-medium px-4 py-2 border-b-2 transition-colors ${activeLogTab === 'rivers' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                River Logs
              </button>
              <button 
                onClick={() => { setActiveLogTab('pps'); setCurrentPage(1); }}
                className={`text-sm font-medium px-4 py-2 border-b-2 transition-colors ${activeLogTab === 'pps' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                PPS Supplies
              </button>
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
                  <th scope="col" className="px-6 py-4 font-semibold">Date</th>
                  <th scope="col" className="px-6 py-4 font-semibold">{activeLogTab === 'roads' ? 'Road' : activeLogTab === 'rivers' ? 'River' : 'PPS Name'}</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold">{activeLogTab === 'pps' ? 'Updated By' : 'Submitter'}</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">{activeLogTab === 'pps' ? 'Delete' : 'Delete & Revert'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800/80">
                {isLoading ? (
                  <tr><td colSpan="5" className="p-6 text-center">Loading...</td></tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr><td colSpan="5" className="p-6 text-center">No logs found matching your filters.</td></tr>
                ) : paginatedLogs.map((log) => (
                  <tr key={log.id} className="bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(log.created_at || log.updated_at).toLocaleString('en-MY')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{activeLogTab === 'roads' ? log.road_name : activeLogTab === 'rivers' ? log.river_name : log.pps_name}</td>
                    <td className="px-6 py-4">{activeLogTab === 'pps' ? '-' : log.status}</td>
                    <td className="px-6 py-4">
                      {activeLogTab === 'pps' ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-gray-900 dark:text-white font-medium text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            {log.last_updated_by || '-'}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            {log.last_updated_email || '-'}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-gray-900 dark:text-white font-medium text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            {log.submitted_by_name || '-'}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            {log.submitted_by_email || '-'}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setLogToDelete(log)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete this log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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
        </section>

      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {logToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setLogToDelete(null)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden pointer-events-auto border border-gray-200 dark:border-zinc-800"
              >
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Submission?</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    Are you sure you want to delete the log for <span className="font-semibold text-gray-900 dark:text-white">{logToDelete.road_name || logToDelete.river_name || logToDelete.pps_name}</span>? {activeLogTab !== 'pps' && 'This will permanently undo the status change on the live ArcGIS map.'}
                  </p>
                  
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setLogToDelete(null)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeDeleteLog}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Deleting...
                        </>
                      ) : (
                        'Yes, Delete'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}