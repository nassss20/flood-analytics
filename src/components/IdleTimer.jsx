import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function IdleTimer({ children }) {
  const [isIdle, setIsIdle] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const { user } = useAuth();
  const navigate = useNavigate();

  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
  const idleTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const startIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      setCountdown(15);
    }, IDLE_TIMEOUT_MS);
  };

  const resetTimer = () => {
    if (isIdle) return; // Do not reset if the modal is already showing
    startIdleTimer();
  };

  const handleContinue = () => {
    setIsIdle(false);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    startIdleTimer();
  };

  useEffect(() => {
    if (!user) return; // Only track idle if logged in

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    startIdleTimer();

    return () => {
      events.forEach(event => document.removeEventListener(event, resetTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [user, isIdle]);

  useEffect(() => {
    if (isIdle) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isIdle]);

  return (
    <>
      {children}

      {isIdle && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-zinc-800 text-center"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Are you still there?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              You have been inactive for 15 minutes. For your security, you will be automatically logged out in:
            </p>
            
            <div className="text-4xl font-black text-red-500 mb-6 tracking-tighter">
              {countdown}s
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-gray-200 dark:border-zinc-700"
              >
                Log Out Now
              </button>
              <button
                onClick={handleContinue}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                Continue Session
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
