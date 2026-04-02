import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <motion.button
      onClick={toggleTheme}
      className={`relative flex items-center justify-center p-2 rounded-xl transition-colors duration-200 focus:outline-none ${
        isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Moon Icon (show in light mode to switch to dark) */}
        <motion.svg
          initial={false}
          animate={{
            scale: isLight ? 1 : 0,
            opacity: isLight ? 1 : 0,
            rotate: isLight ? 0 : -90
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute inset-0 w-5 h-5 text-gray-800"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </motion.svg>

        {/* Sun Icon (show in dark mode to switch to light) */}
        <motion.svg
          initial={false}
          animate={{
            scale: isLight ? 0 : 1,
            opacity: isLight ? 0 : 1,
            rotate: isLight ? 90 : 0
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute inset-0 w-5 h-5 text-yellow-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </motion.svg>
      </div>
    </motion.button>
  );
}
