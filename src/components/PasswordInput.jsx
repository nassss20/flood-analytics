import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

export default function PasswordInput({ className, onChange, onFocus, onBlur, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const controls = useAnimation();

  // Blink animation interval
  useEffect(() => {
    if (showPassword) return;
    
    const blink = async () => {
      // Rapidly close and open the eye
      await controls.start({ scaleY: 0.1, transition: { duration: 0.1 } });
      await controls.start({ scaleY: 1, transition: { duration: 0.15 } });
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.4) blink(); // 60% chance to blink every 3s
    }, 3000);

    return () => clearInterval(interval);
  }, [showPassword, controls]);

  // Track mouse cursor to move the pupil
  useEffect(() => {
    if (showPassword || isFocused) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate delta from center (normalized to max distance of ~300px)
      const dx = Math.max(-1, Math.min(1, (e.clientX - centerX) / 200));
      const dy = Math.max(-1, Math.min(1, (e.clientY - centerY) / 200));
      
      // Move pupil by max 4 pixels in any direction
      setMousePos({ x: dx * 4, y: dy * 4 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showPassword, isFocused]);

  // Track typing to move the pupil left/right
  const handleInput = (e) => {
    if (onChange) onChange(e);
    if (!isFocused || showPassword) return;
    
    const len = e.target.value.length;
    // Map length to pupil x (-4 to +4)
    const px = Math.max(-4, Math.min(4, (len / 20) * 8 - 4));
    setMousePos({ x: px, y: 0 }); // Look horizontally as typing
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    // Center the eye on focus before starting to track typing length
    setMousePos({ x: -4, y: 0 }); 
    if (onFocus) onFocus(e);
  };
  
  const handleBlur = (e) => {
    setIsFocused(false);
    setMousePos({ x: 0, y: 0 });
    if (onBlur) onBlur(e);
  };

  return (
    <div className="relative w-full">
      <input
        {...props}
        type={showPassword ? "text" : "password"}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleInput}
        className={`block w-full pr-12 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${className || ''}`}
      />
      
      <button
        type="button"
        ref={containerRef}
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 pr-3 pl-3 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors focus:outline-none z-10"
        aria-label={showPassword ? "Hide password" : "Show password"}
        title={showPassword ? "Hide password" : "Show password"}
      >
        <svg 
          width="24" height="24" viewBox="0 0 24 24" fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          {showPassword ? (
            // Cute "happy/shy" closed eyes when password is visible
            <motion.path 
              d="M7 14 Q 12 9 17 14" 
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: "spring" }}
            />
          ) : (
            // Big cute cartoon eye when password is hidden (tracking you)
            <motion.g
              animate={controls}
              style={{ transformOrigin: "50% 50%" }}
            >
              {/* Eye White / Outline */}
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="var(--color-bg, white)" className="fill-white dark:fill-zinc-800" />
              
              {/* Pupil Group */}
              <motion.g
                animate={{ 
                  x: mousePos.x, 
                  y: mousePos.y
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {/* Big Pupil */}
                <circle cx="12" cy="12" r="4.5" fill="currentColor" />
                {/* Cute Sparkle */}
                <circle cx="10.5" cy="10.5" r="1.5" fill="white" className="dark:fill-zinc-900" />
              </motion.g>
            </motion.g>
          )}
        </svg>
      </button>
    </div>
  );
}
