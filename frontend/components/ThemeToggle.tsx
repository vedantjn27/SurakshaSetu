'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (!theme) return null; // Wait for hydration

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground flex items-center justify-center"
      aria-label="Toggle Theme"
      title="Toggle Dark/Light Mode"
    >
      {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </motion.button>
  );
}
