/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'navy' | 'dark';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to clean White & Navy-Blue
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('vayutrace_theme') as AppTheme;
      if (saved === 'navy' || saved === 'dark') return saved;
    } catch {}
    return 'navy';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('vayutrace_theme', newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'navy' ? 'dark' : 'navy');
  };

  const isDark = theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.remove('theme-navy', 'theme-emerald-sky', 'theme-sky', 'theme-dark', 'theme-light', 'theme-midnight', 'dark', 'light');
    root.classList.add(`theme-${theme}`);

    if (isDark) {
      root.classList.add('dark');
      body.className = 'bg-slate-950 text-slate-100 antialiased selection:bg-blue-900 selection:text-white min-h-screen';
    } else {
      root.classList.add('light');
      body.className = 'bg-slate-50 text-slate-900 antialiased selection:bg-blue-900 selection:text-white min-h-screen';
    }
  }, [theme, isDark]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
