'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
export type A11yPalette = 'default' | 'colorblind' | 'high-contrast' | 'monochrome';
export type A11yText = 'normal' | 'large';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
  a11yPalette: A11yPalette;
  setA11yPalette: (palette: A11yPalette) => void;
  a11yText: A11yText;
  setA11yText: (size: A11yText) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyTheme = (newTheme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (newTheme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }
};

const applyA11y = (palette: A11yPalette, text: A11yText) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (palette === 'default') {
    root.removeAttribute('data-a11y');
  } else {
    root.setAttribute('data-a11y', palette);
  }
  if (text === 'large') {
    root.setAttribute('data-text', 'large');
  } else {
    root.removeAttribute('data-text');
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [a11yPalette, setA11yPaletteState] = useState<A11yPalette>('default');
  const [a11yText, setA11yTextState] = useState<A11yText>('normal');

  useEffect(() => {
    try {
      setThemeState('light');
      applyTheme('light');
      localStorage.setItem('studymind-theme', 'light');

      const savedPalette = localStorage.getItem('studymind-a11y') as A11yPalette | null;
      const palette: A11yPalette =
        savedPalette === 'colorblind' || savedPalette === 'high-contrast' || savedPalette === 'monochrome'
          ? savedPalette
          : 'default';
      setA11yPaletteState(palette);

      const savedText = localStorage.getItem('studymind-text') as A11yText | null;
      const text: A11yText = savedText === 'large' ? 'large' : 'normal';
      setA11yTextState(text);
      applyA11y(palette, text);
    } catch {
      applyTheme('light');
      applyA11y('default', 'normal');
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('studymind-theme', newTheme);
    } catch {
      // ignore
    }
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const setA11yPalette = (palette: A11yPalette) => {
    setA11yPaletteState(palette);
    try {
      localStorage.setItem('studymind-a11y', palette);
    } catch {
      // ignore
    }
    applyA11y(palette, a11yText);
  };

  const setA11yText = (size: A11yText) => {
    setA11yTextState(size);
    try {
      localStorage.setItem('studymind-text', size);
    } catch {
      // ignore
    }
    applyA11y(a11yPalette, size);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isDarkMode: theme === 'dark',
        a11yPalette,
        setA11yPalette,
        a11yText,
        setA11yText,
      }}
    >
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
