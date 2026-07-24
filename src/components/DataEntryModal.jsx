import { useState, useEffect } from 'react';
import { Database, Save, CheckCircle2, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Select from 'react-select';
import { fetchRoads, updateRoadStatus } from '../lib/arcgisClient';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function DataEntryModal({ isOpen, onClose }) {
  const [roads, setRoads] = useState([]);
  const [selectedRoadId, setSelectedRoadId] = useState('');
  const [selectedRoadData, setSelectedRoadData] = useState(null);

  const [floodDepth, setFloodDepth] = useState('');
  const [status, setStatus] = useState('');
  const [damageType, setDamageType] = useState('');
  const [submittedByName, setSubmittedByName] = useState('');

  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRoads, setIsLoadingRoads] = useState(true);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch roads when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    async function loadRoads() {
      setIsLoadingRoads(true);
      try {
        const roadData = await fetchRoads();
        setRoads(roadData);
      } catch (err) {
        console.error("Failed to load roads", err);
        setErrorMsg("Failed to load roads from ArcGIS.");
      } finally {
        setIsLoadingRoads(false);
      }
    }
    
    if (roads.length === 0) {
      loadRoads();
    } else {
      setIsLoadingRoads(false);
    }
  }, [isOpen, roads.length]);

  // When a road is selected from the dropdown, update the auto-fill fields
  useEffect(() => {
    if (selectedRoadId) {
      const road = roads.find(r => r.OBJECTID.toString() === selectedRoadId);
      if (road) {
        setSelectedRoadData(road);
        setFloodDepth(road.DEPTH !== null ? road.DEPTH.toString() : '');
        setStatus(road.Status || '');
        setDamageType(road.DAMAGE || '');
      }
    } else {
      setSelectedRoadData(null);
      setFloodDepth('');
      setStatus('');
      setDamageType('');
    }
  }, [selectedRoadId, roads]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoadId) return;

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMsg('');

    try {
      const attributes = {
        DEPTH: floodDepth === '' || isNaN(parseFloat(floodDepth)) ? null : parseFloat(floodDepth),
        Status: status || null,
        DAMAGE: damageType || null,
      };

      await updateRoadStatus(parseInt(selectedRoadId), attributes);

      // Log to Supabase
      const logEntry = {
        road_name: selectedRoadData?.Name || 'Unknown Road',
        district: selectedRoadData?.DISTRICT || null,
        status: status || null,
        depth: attributes.DEPTH,
        damage: damageType || null,
        submitted_by_name: submittedByName,
        submitted_by_email: user?.email || 'Unknown',
        user_id: user?.id
      };

      const { error: dbError } = await supabase
        .from('submission_logs')
        .insert([logEntry]);

      if (dbError) {
        console.error("Failed to insert log into Supabase:", dbError);
      }

      setSubmitStatus('success');

      // Update local state so it stays synced
      setRoads(prevRoads =>
        prevRoads.map(r =>
          r.OBJECTID.toString() === selectedRoadId
            ? { ...r, ...attributes }
            : r
        )
      );

      // Close modal after success
      setTimeout(() => {
        setSubmitStatus(null);
        onClose();
        // Reset form
        setSelectedRoadId('');
        setFloodDepth('');
        setStatus('');
        setDamageType('');
      }, 2000);

    } catch (err) {
      console.error(err);
      setSubmitStatus('error');
      setErrorMsg(err.message || 'An error occurred while updating the map.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Overlay */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden relative pointer-events-auto max-h-[90vh] flex flex-col"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                  <Database className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Update Road Status</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="overflow-y-auto p-6">
                <form onSubmit={handleSubmit} id="data-entry-form" className="flex flex-col gap-6">

                  {/* Section 1: Location Details */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white pb-1 border-b border-gray-100 dark:border-zinc-800">1. Select Road</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search & Select Road *</label>
                        <Select
                          options={roads.map(road => ({
                            value: road.OBJECTID.toString(),
                            label: `${road.Route_No ? `${road.Route_No} - ` : ''}${road.Name} (${road.DISTRICT})`
                          }))}
                          value={selectedRoadId ? {
                            value: selectedRoadId,
                            label: selectedRoadData ? `${selectedRoadData.Route_No ? `${selectedRoadData.Route_No} - ` : ''}${selectedRoadData.Name} (${selectedRoadData.DISTRICT})` : ''
                          } : null}
                          onChange={(selectedOption) => setSelectedRoadId(selectedOption ? selectedOption.value : '')}
                          isDisabled={isLoadingRoads || isSubmitting}
                          placeholder={isLoadingRoads ? "Loading roads from ArcGIS..." : "-- Search or Select a Road --"}
                          isClearable
                          isSearchable
                          className="react-select-container"
                          classNamePrefix="react-select"
                          styles={{
                            control: (baseStyles) => ({
                              ...baseStyles,
                              borderRadius: '0.5rem',
                              borderColor: 'rgb(209 213 219)',
                              padding: '0.15rem',
                            }),
                            menuPortal: base => ({ ...base, zIndex: 9999 })
                          }}
                          menuPortalTarget={document.body}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Road Type</label>
                        <input
                          type="text"
                          disabled
                          value={selectedRoadData ? (selectedRoadData.ROUTETYPE || 'N/A') : ''}
                          className="block w-full px-3 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">District</label>
                        <input
                          type="text"
                          disabled
                          value={selectedRoadData ? (selectedRoadData.DISTRICT || 'N/A') : ''}
                          className="block w-full px-3 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Report Details */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white pb-1 border-b border-gray-100 dark:border-zinc-800">2. Update Status</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Flood Depth (meters)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={floodDepth}
                          onChange={(e) => setFloodDepth(e.target.value)}
                          disabled={isLoadingRoads || isSubmitting}
                          placeholder="e.g. 1.5"
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Road Status *</label>
                        <select
                          required
                          disabled={!selectedRoadId || isSubmitting}
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="">-- Select Status --</option>
                          <option value="Open">Open</option>
                          <option value="Open for Heavy Vehicles Only">Open for Heavy Vehicles Only</option>
                          <option value="Closed">Closed</option>
                          <option value="Pending Assessment">Pending Assessment</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={submittedByName}
                          onChange={(e) => setSubmittedByName(e.target.value)}
                          disabled={isLoadingRoads || isSubmitting}
                          placeholder="e.g. Nasrin Sahira"
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Damage Description (Optional)</label>
                        <textarea
                          rows={2}
                          disabled={!selectedRoadId || isSubmitting}
                          value={damageType}
                          onChange={(e) => setDamageType(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
                          placeholder="E.g., Potholes, washed out shoulder..."
                        />
                      </div>

                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <AnimatePresence mode="wait">
                    {submitStatus === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2 text-green-600 dark:text-green-400"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Successfully updated!</span>
                      </motion.div>
                    )}
                    {submitStatus === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2 text-red-600 dark:text-red-400"
                      >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium line-clamp-1" title={errorMsg}>{errorMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="data-entry-form"
                    disabled={isSubmitting || !selectedRoadId}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSubmitting ? 'Updating...' : 'Submit Report'}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
