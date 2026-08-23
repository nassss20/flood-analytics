import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from '../lib/supabaseClient';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      // Successful login automatically updates AuthContext which navigates due to App.jsx routing
      setIsLoading(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex w-full h-[calc(100vh-80px)] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden relative">
          {/* Glassmorphism accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

          <div className="p-8">
            <div className="flex flex-col items-center justify-center gap-4 pt-4 pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="flex items-center justify-center"
              >
                <img src="/floodwise-circle.png" alt="FloodWise Logo" className="w-24 h-24 drop-shadow-lg" />
              </motion.div>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome to FloodWise</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sign in to access the management portal</p>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-zinc-800 my-6" />

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <PasswordInput
                    required
                    className="pl-10 bg-gray-50 dark:bg-zinc-800/50"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-800 dark:border-zinc-700" />
                  Remember me
                </label>
                <a href="#" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-4 w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
