'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PrintIcon from '@mui/icons-material/Print';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { useLiquidTheme } from '../../contexts/ThemeContext';
import { Patient } from '../../types';

interface SuccessModalProps {
  open: boolean;
  patient: Patient | null;
  onOpenCasePaper: () => void;
  onAddNewPatient: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  open,
  patient,
  onOpenCasePaper,
  onAddNewPatient,
}) => {
  const { primaryColor, liquidGlass } = useLiquidTheme();

  if (!patient) return null;

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '14px',
          background: liquidGlass.glassBg,
          backdropFilter: liquidGlass.backdropBlur,
          WebkitBackdropFilter: liquidGlass.backdropBlur,
          border: liquidGlass.glassBorder,
          boxShadow: liquidGlass.glassShadow,
          p: { xs: 2.5, sm: 3 },
          textAlign: 'center',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 1 }}>
        <Box
          sx={{
            display: 'inline-flex',
            p: 1.5,
            borderRadius: '12px',
            bgcolor: '#22c55e18',
            color: '#16a34a',
            mb: 1,
          }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Registration Successful!
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Patient has been enrolled in the camp database.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 1.5 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            bgcolor: `${primaryColor}0d`,
            border: `1px solid ${primaryColor}22`,
            textAlign: 'left',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryColor }}>
            Patient ID: #{String(patient.patientId).padStart(3, '0')}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
            {patient.name} ({patient.age} Yrs / {patient.gender})
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Mobile: {patient.mobile}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', gap: 1.5, px: 2, pb: 2 }}>
        {/* 1. Print Case Paper */}
        <Button
          fullWidth
          variant="contained"
          size="medium"
          onClick={onOpenCasePaper}
          startIcon={<PrintIcon />}
          sx={{
            bgcolor: primaryColor,
            py: 1.2,
            fontWeight: 700,
            borderRadius: '10px',
          }}
        >
          Print Case Paper
        </Button>

        {/* 2. Add New Patient */}
        <Button
          fullWidth
          variant="outlined"
          size="medium"
          onClick={onAddNewPatient}
          startIcon={<PersonAddAlt1Icon />}
          sx={{
            py: 1.2,
            fontWeight: 700,
            borderRadius: '10px',
            borderColor: `${primaryColor}66`,
            color: primaryColor,
            '&:hover': {
              borderColor: primaryColor,
              bgcolor: `${primaryColor}0d`,
            },
          }}
        >
          Add New Patient
        </Button>
      </DialogActions>
    </Dialog>
  );
};
