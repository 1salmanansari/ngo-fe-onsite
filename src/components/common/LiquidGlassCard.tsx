'use client';

import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { useLiquidTheme } from '../../contexts/ThemeContext';

interface LiquidGlassCardProps extends BoxProps {
  interactive?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  interactive = false,
  sx,
  ...rest
}) => {
  const { liquidGlass, primaryColor } = useLiquidTheme();

  return (
    <Box
      sx={{
        background: liquidGlass.glassBg,
        backdropFilter: liquidGlass.backdropBlur,
        WebkitBackdropFilter: liquidGlass.backdropBlur,
        border: liquidGlass.glassBorder,
        borderRadius: '14px',
        boxShadow: liquidGlass.glassShadow,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(interactive && {
          cursor: 'pointer',
          '&:hover': {
            background: liquidGlass.glassCardHover,
            borderColor: `${primaryColor}66`,
            boxShadow: `0 12px 36px 0 ${primaryColor}26`,
          },
        }),
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
};
