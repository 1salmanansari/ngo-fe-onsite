'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Box, Typography, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import { ToastState } from '../types';
import { useLiquidTheme } from './ThemeContext';

interface ToastContextType {
  showToast: (message: string, state?: ToastState) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<ToastState>('SUCCESS');
  const { mode } = useLiquidTheme();

  const showToast = useCallback((msg: string, toastState: ToastState = 'SUCCESS') => {
    setMessage(msg);
    setState(toastState);
    setOpen(true);
  }, []);

  const hideToast = useCallback(() => {
    setOpen(false);
  }, []);

  // Theme styling based on TOAST-SAMPLE.png
  const getToastConfig = (s: ToastState, isDark: boolean) => {
    switch (s) {
      case 'SUCCESS':
        return {
          borderColor: '#22c55e',
          bgColor: isDark ? '#141e17' : '#f0fdf4',
          textColor: isDark ? '#f0fdf4' : '#14532d',
          accentColor: '#22c55e',
          icon: <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 22 }} />,
        };
      case 'ALERT':
        return {
          borderColor: '#f59e0b',
          bgColor: isDark ? '#231d10' : '#fffbeb',
          textColor: isDark ? '#fef3c7' : '#78350f',
          accentColor: '#f59e0b',
          icon: <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 22 }} />,
        };
      case 'ERROR':
        return {
          borderColor: '#ef4444',
          bgColor: isDark ? '#231212' : '#fef2f2',
          textColor: isDark ? '#fee2e2' : '#7f1d1d',
          accentColor: '#ef4444',
          icon: <CancelIcon sx={{ color: '#ef4444', fontSize: 22 }} />,
        };
      default: // INFO
        return {
          borderColor: '#3b82f6',
          bgColor: isDark ? '#101a2c' : '#eff6ff',
          textColor: isDark ? '#dbeafe' : '#1e3a8a',
          accentColor: '#3b82f6',
          icon: <InfoIcon sx={{ color: '#3b82f6', fontSize: 22 }} />,
        };
    }
  };

  const isDark = mode === 'dark';
  const config = getToastConfig(state, isDark);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={2000} // exactly 2 seconds as requested
        onClose={hideToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{
          zIndex: 9999,
          bottom: { xs: 20, sm: 28 },
          left: { xs: 16, sm: 24 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.25,
            minWidth: { xs: 'calc(100vw - 32px)', sm: 340 },
            maxWidth: { xs: 'calc(100vw - 32px)', sm: 460 },
            borderRadius: '12px',
            border: `1px solid ${config.borderColor}`,
            bgcolor: config.bgColor,
            boxShadow: isDark ? '0 8px 28px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Status Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{config.icon}</Box>

          {/* Toast Message */}
          <Typography
            variant="body2"
            sx={{
              color: config.textColor,
              fontWeight: 500,
              fontSize: '0.875rem',
              lineHeight: 1.4,
              flex: 1,
            }}
          >
            {message}
          </Typography>

          {/* Close Icon in Accent Color */}
          <IconButton
            size="small"
            aria-label="close"
            onClick={hideToast}
            sx={{
              color: config.accentColor,
              p: 0.5,
              flexShrink: 0,
              '&:hover': {
                bgcolor: `${config.accentColor}18`,
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastContextProvider');
  }
  return context;
};
