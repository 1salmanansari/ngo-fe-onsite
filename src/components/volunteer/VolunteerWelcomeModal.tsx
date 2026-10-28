'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import { useVolunteer } from '../../contexts/VolunteerContext';
import { useLiquidTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { registerVolunteerApi } from '../../utils/api';

export const VolunteerWelcomeModal: React.FC = () => {
  const { isWelcomeModalOpen, setVolunteerData } = useVolunteer();
  const { primaryColor, liquidGlass } = useLiquidTheme();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    let isValid = true;

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setNameError('Name must be at least 3 characters');
      isValid = false;
    } else if (trimmedName.length > 50) {
      setNameError('Name cannot exceed 50 characters');
      isValid = false;
    } else {
      setNameError(null);
    }

    const trimmedMobile = mobile.trim();
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(trimmedMobile)) {
      setMobileError('Mobile number must be exactly 10 digits');
      isValid = false;
    } else {
      setMobileError(null);
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await registerVolunteerApi({
        name: name.trim(),
        role: 'VOLUNTEER',
        mobile: mobile.trim(),
      });

      setVolunteerData({
        id: result.id,
        name: result.name || name.trim(),
        mobile: result.mobile || mobile.trim(),
        role: result.role || 'VOLUNTEER',
        username: result.username,
      });

      showToast(`Welcome, ${name.trim()}! You are ready for camp duty.`, 'SUCCESS');
    } catch (err: any) {
      // In case volunteer already exists or API offline, still establish session gracefully
      const fallbackVolunteer = {
        id: 'vol-' + Date.now(),
        name: name.trim(),
        mobile: mobile.trim(),
        role: 'VOLUNTEER',
      };
      setVolunteerData(fallbackVolunteer);
      showToast(`Welcome back, ${name.trim()}!`, 'SUCCESS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isWelcomeModalOpen}
      disableEscapeKeyDown
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
          p: { xs: 2.5, sm: 3.5 },
        },
      }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, pt: 1 }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 1.5,
              borderRadius: '12px',
              bgcolor: `${primaryColor}18`,
              color: primaryColor,
              mb: 1.5,
            }}
          >
            <VolunteerActivismIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Welcome to Pragati Camp
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Please enter your volunteer details to initiate your counter session.
          </Typography>
        </DialogTitle>

        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            pt: '24px !important',
            overflow: 'visible',
          }}
        >
          {/* Volunteer Name */}
          <TextField
            label="Volunteer Full Name"
            placeholder="e.g. John Doe"
            required
            fullWidth
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            error={Boolean(nameError)}
            helperText={nameError || 'Min 3 and max 50 characters'}
            disabled={loading}
          />

          {/* Volunteer Mobile */}
          <TextField
            label="Mobile Number"
            placeholder="10 digit mobile number"
            required
            fullWidth
            type="tel"
            value={mobile}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
              setMobile(val);
              if (mobileError) setMobileError(null);
            }}
            error={Boolean(mobileError)}
            helperText={mobileError || 'Exactly 10 digits required'}
            disabled={loading}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              bgcolor: primaryColor,
              py: 1.3,
              fontWeight: 700,
              fontSize: '1rem',
              borderRadius: '10px',
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Start Volunteer Shift'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
