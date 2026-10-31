'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { PrimaryColorChoice, ThemeMode } from '../types';

interface LiquidGlassTokens {
  glassBg: string;
  glassBorder: string;
  glassShadow: string;
  glassCardHover: string;
  backdropBlur: string;
}

interface ThemeContextType {
  mode: ThemeMode;
  primaryColor: PrimaryColorChoice;
  toggleMode: () => void;
  setPrimaryColor: (color: PrimaryColorChoice) => void;
  liquidGlass: LiquidGlassTokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [primaryColor, setPrimaryColor] = useState<PrimaryColorChoice>('#1556A3');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('pragati_theme_mode') as ThemeMode;
    const savedColor = localStorage.getItem('pragati_primary_color') as PrimaryColorChoice;
    if (savedMode) setMode(savedMode);
    if (savedColor) setPrimaryColor(savedColor);
    setMounted(true);
  }, []);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('pragati_theme_mode', next);
      return next;
    });
  };

  const handleSetPrimaryColor = (color: PrimaryColorChoice) => {
    setPrimaryColor(color);
    localStorage.setItem('pragati_primary_color', color);
  };

  const liquidGlass = useMemo<LiquidGlassTokens>(() => {
    const isDark = mode === 'dark';
    return {
      glassBg: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.68)',
      glassBorder: isDark
        ? '1px solid rgba(255, 255, 255, 0.12)'
        : '1px solid rgba(255, 255, 255, 0.45)',
      glassShadow: isDark
        ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        : '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
      glassCardHover: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.82)',
      backdropBlur: 'blur(16px)',
    };
  }, [mode]);

  const muiTheme = useMemo(() => {
    const isDark = mode === 'dark';
    return createTheme({
      palette: {
        mode,
        primary: {
          main: primaryColor,
          light: primaryColor === '#1556A3' ? '#427bbd' : '#3db871',
          dark: primaryColor === '#1556A3' ? '#0d3a6e' : '#116132',
          contrastText: '#ffffff',
        },
        background: {
          default: isDark ? '#0b1120' : '#f0f4f8',
          paper: isDark ? '#111827' : '#ffffff',
        },
        text: {
          primary: isDark ? '#f1f5f9' : '#0f172a',
          secondary: isDark ? '#94a3b8' : '#475569',
        },
      },
      typography: {
        fontFamily: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ].join(','),
        h5: {
          fontWeight: 700,
        },
        h6: {
          fontWeight: 600,
        },
        button: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
      shape: {
        borderRadius: 12,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              boxShadow: 'none',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 4px 14px 0 rgba(0,0,0,0.12)',
              },
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 10,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
              },
            },
          },
        },
      },
    });
  }, [mode, primaryColor]);

  // Avoid flash before mount
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        primaryColor,
        toggleMode,
        setPrimaryColor: handleSetPrimaryColor,
        liquidGlass,
      }}
    >
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useLiquidTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useLiquidTheme must be used within ThemeContextProvider');
  }
  return context;
};
