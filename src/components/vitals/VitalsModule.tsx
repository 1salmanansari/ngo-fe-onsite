'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  InputAdornment,
  Autocomplete,
  Chip,
  Breadcrumbs,
  Link,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { QRScannerModal } from './QRScannerModal';
import { useLiquidTheme } from '../../contexts/ThemeContext';
import { useVolunteer } from '../../contexts/VolunteerContext';
import { useToast } from '../../contexts/ToastContext';
import { searchPatientsApi, getPatientByIdApi, updatePatientVitalsApi } from '../../utils/api';
import { IVitals, Patient } from '../../types';

export const VitalsModule: React.FC = () => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const { primaryColor } = useLiquidTheme();
  const { incrementPatientCount } = useVolunteer();
  const { showToast } = useToast();

  const [activeView, setActiveView] = useState<'cards' | 'search' | 'vitals'>('cards');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Search Autocomplete State with 500ms debounce
  const [searchInput, setSearchInput] = useState('');
  const [searchOptions, setSearchOptions] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // QR Scanner Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Vitals Form State
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState<number | ''>('');
  const [temperature, setTemperature] = useState<number | ''>('');
  const [spo2, setSpo2] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [submittingVitals, setSubmittingVitals] = useState(false);

  // Set default view on web
  useEffect(() => {
    if (!isMobile && activeView === 'cards') {
      setActiveView('search');
    }
  }, [isMobile, activeView]);

  // Debounced search effect (500ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchInput || searchInput.trim().length === 0) {
      setSearchOptions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchPatientsApi(searchInput);
        setSearchOptions(results);
      } catch {
        setSearchOptions([]);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    if (patient.vitals) {
      setBp(patient.vitals.bp || '');
      setPulse(patient.vitals.pulse ?? '');
      setTemperature(patient.vitals.tempreture ?? '');
      setSpo2(patient.vitals.spo2 ?? '');
      setWeight(patient.vitals.weight ?? '');
      setHeight(patient.vitals.height ?? '');
    } else {
      setBp('');
      setPulse('');
      setTemperature('');
      setSpo2('');
      setWeight('');
      setHeight('');
    }
    setActiveView('vitals');
  };

  const handleQrScanSuccess = async (patientIdOrCode: string | number) => {
    setIsQrModalOpen(false);
    setLoadingPatient(true);
    try {
      const patient = await getPatientByIdApi(patientIdOrCode);
      handleSelectPatient(patient);
      showToast(`Loaded Patient #${patient.patientId}: ${patient.name}`, 'SUCCESS');
    } catch (err: any) {
      showToast(err.message || 'Could not find patient with this QR code', 'ERROR');
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleResetForm = () => {
    setBp('');
    setPulse('');
    setTemperature('');
    setSpo2('');
    setWeight('');
    setHeight('');
    setSelectedPatient(null);
    setSearchInput('');
    setSearchOptions([]);

    if (isMobile) {
      setActiveView('cards');
    } else {
      setActiveView('search');
    }
  };

  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setSubmittingVitals(true);
    try {
      const vitalsPayload: IVitals = {
        bp: bp.trim() || undefined,
        pulse: pulse !== '' ? Number(pulse) : undefined,
        tempreture: temperature !== '' ? Number(temperature) : undefined,
        spo2: spo2 !== '' ? Number(spo2) : undefined,
        weight: weight !== '' ? Number(weight) : undefined,
        height: height !== '' ? Number(height) : undefined,
      };

      const updated = await updatePatientVitalsApi(
        selectedPatient.patientId || selectedPatient.id,
        vitalsPayload
      );

      // Toast notification for 2 seconds
      showToast(`Vitals recorded for Patient #${updated.patientId} successfully!`, 'SUCCESS');
      incrementPatientCount();

      // Reset to initial view
      handleResetForm();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit vitals', 'ERROR');
    } finally {
      setSubmittingVitals(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      {/* 1. MOBILE VIEW: TWO CONJUNCTED SQUARE CARDS */}
      {isMobile && activeView === 'cards' && (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 1.5,
              borderRadius: '12px',
              bgcolor: `${primaryColor}14`,
              color: primaryColor,
              mb: 1.5,
            }}
          >
            <MonitorHeartIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Vitals Station Counter
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, px: 2 }}>
            Scan patient QR or search by name to record clinical vitals.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              px: 1,
            }}
          >
            {/* FIRST CARD: QR Code */}
            <LiquidGlassCard
              interactive
              onClick={() => setIsQrModalOpen(true)}
              sx={{
                width: '48%',
                aspectRatio: '1 / 1',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '14px',
                transform: 'scale(1.05)',
                transition: 'transform 0.25s ease-out, box-shadow 0.25s ease-out',
                '&:hover, &:active': {
                  transform: 'scale(1.08)',
                  zIndex: 2,
                  borderColor: primaryColor,
                },
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  bgcolor: `${primaryColor}18`,
                  color: primaryColor,
                  mb: 1,
                }}
              >
                <QrCodeScannerIcon sx={{ fontSize: 36 }} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Scan QR
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.2 }}>
                Camera Scan
              </Typography>
            </LiquidGlassCard>

            {/* SECOND CARD: Search */}
            <LiquidGlassCard
              interactive
              onClick={() => setActiveView('search')}
              sx={{
                width: '48%',
                aspectRatio: '1 / 1',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '14px',
                transition: 'transform 0.25s ease-out, box-shadow 0.25s ease-out',
                '&:hover, &:active': {
                  transform: 'scale(1.05)',
                  zIndex: 2,
                  borderColor: primaryColor,
                },
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  bgcolor: `${primaryColor}18`,
                  color: primaryColor,
                  mb: 1,
                }}
              >
                <SearchIcon sx={{ fontSize: 36 }} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Search
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.2 }}>
                By Name / ID
              </Typography>
            </LiquidGlassCard>
          </Box>
        </Box>
      )}

      {/* 2. SEARCH AUTOCOMPLETE VIEW */}
      {activeView === 'search' && (
        <LiquidGlassCard sx={{ p: { xs: 2.5, sm: 4 }, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 1.5,
              borderRadius: '12px',
              bgcolor: `${primaryColor}14`,
              color: primaryColor,
              mb: 1,
            }}
          >
            <SearchIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Search Registered Patient
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Search registered patients by full name, ID, or phone number.
          </Typography>

          <Box sx={{ maxWidth: 640, mx: 'auto', mb: 2 }}>
            <Autocomplete
              freeSolo
              options={searchOptions}
              getOptionLabel={(option) =>
                typeof option === 'string'
                  ? option
                  : `#${option.patientId} - ${option.name} (${option.mobile})`
              }
              onInputChange={(_, value) => setSearchInput(value)}
              onChange={(_, value) => {
                if (value && typeof value !== 'string') {
                  handleSelectPatient(value);
                }
              }}
              loading={searching}
              noOptionsText={
                searchInput.trim().length > 0
                  ? `No registered patients found matching "${searchInput}"`
                  : 'Start typing patient name, mobile, or ID...'
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search patient by name, mobile, or ID..."
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: primaryColor, ml: 1 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {searching ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                    sx: {
                      borderRadius: '12px',
                      py: 0.6,
                      fontSize: '0.95rem',
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  {...props}
                  key={option.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 1.2,
                    px: 2,
                    borderRadius: '8px',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {option.name}
                    </Typography>
                    <Chip
                      label={`#${option.patientId}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        bgcolor: `${primaryColor}15`,
                        color: primaryColor,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
                      {option.gender} | {option.age} Yrs
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.3 }}>
                    Mobile: {option.mobile} &bull; Complaint: {option.complaint}
                  </Typography>
                </Box>
              )}
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<QrCodeScannerIcon />}
              onClick={() => setIsQrModalOpen(true)}
              sx={{
                borderRadius: '10px',
                borderColor: `${primaryColor}55`,
                color: primaryColor,
                fontWeight: 600,
              }}
            >
              Scan Patient QR Code Instead
            </Button>
          </Box>
        </LiquidGlassCard>
      )}

      {/* 3. VITALS ENTRY FORM */}
      {activeView === 'vitals' && selectedPatient && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Breadcrumbs Navigation */}
          <Breadcrumbs
            separator={<NavigateNextIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
            aria-label="breadcrumb"
          >
            <Link
              component="button"
              type="button"
              onClick={handleResetForm}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                color: primaryColor,
                fontWeight: 600,
                fontSize: '0.85rem',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <SearchIcon sx={{ fontSize: '1rem' }} />
              Vitals Station
            </Link>
            <Typography sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.85rem' }}>
              {selectedPatient.name} (#{String(selectedPatient.patientId).padStart(3, '0')})
            </Typography>
          </Breadcrumbs>

          {/* Airy, Structured Patient Details Card */}
          <LiquidGlassCard sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: primaryColor }}>
                  {selectedPatient.name}
                </Typography>
                <Chip
                  label={`Patient #${String(selectedPatient.patientId).padStart(3, '0')}`}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 800, fontSize: '0.75rem', borderRadius: '6px' }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {selectedPatient.gender} &bull; {selectedPatient.age} Yrs
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Mobile: <strong>{selectedPatient.mobile}</strong>
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: '10px',
                bgcolor: `${primaryColor}0a`,
                border: `1px solid ${primaryColor}1a`,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontWeight: 700, display: 'block' }}
              >
                CHIEF COMPLAINT:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.3 }}>
                {selectedPatient.complaint}
              </Typography>
            </Box>
          </LiquidGlassCard>

          {/* Vitals Input Form */}
          <LiquidGlassCard sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <form onSubmit={handleSubmitVitals} noValidate>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Record Patient Vitals
              </Typography>

              <Grid container spacing={2.5}>
                {/* Blood Pressure */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Patient Blood Pressure"
                    placeholder="e.g. 120/80"
                    fullWidth
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    helperText="Optional: Systolic/Diastolic (mmHg)"
                    disabled={submittingVitals}
                  />
                </Grid>

                {/* Pulses */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Patient Pulses"
                    placeholder="e.g. 72"
                    fullWidth
                    type="number"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value === '' ? '' : Number(e.target.value))}
                    helperText="Optional: Heart rate (bpm)"
                    disabled={submittingVitals}
                  />
                </Grid>

                {/* Body Temperature */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Patient Body Temperature"
                    placeholder="e.g. 98.6"
                    fullWidth
                    type="number"
                    value={temperature}
                    onChange={(e) =>
                      setTemperature(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    helperText="Optional: Degrees Fahrenheit (°F)"
                    disabled={submittingVitals}
                  />
                </Grid>

                {/* SPO2 */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Patient SPO2 (Oxygen)"
                    placeholder="e.g. 98"
                    fullWidth
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value === '' ? '' : Number(e.target.value))}
                    helperText="Optional: Blood Oxygen Saturation (%)"
                    disabled={submittingVitals}
                  />
                </Grid>

                {/* Weight */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Patient Weight"
                    placeholder="e.g. 68"
                    fullWidth
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                    helperText="Optional: Weight in kilograms (kg)"
                    disabled={submittingVitals}
                  />
                </Grid>

                {/* Height */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Patient Height"
                    placeholder="e.g. 175"
                    fullWidth
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                    helperText="Optional: Height in centimeters (cm)"
                    disabled={submittingVitals}
                  />
                </Grid>

                {/* Action Buttons: RESET and SUBMIT */}
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column-reverse', sm: 'row' },
                      justifyContent: 'flex-end',
                      gap: 2,
                    }}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      size="large"
                      onClick={handleResetForm}
                      disabled={submittingVitals}
                      startIcon={<RestartAltIcon />}
                      sx={{
                        py: 1.3,
                        px: 3.5,
                        fontWeight: 700,
                        borderRadius: '10px',
                        borderColor: 'text.secondary',
                        color: 'text.secondary',
                      }}
                    >
                      RESET
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={submittingVitals}
                      startIcon={!submittingVitals && <CheckCircleIcon />}
                      sx={{
                        bgcolor: primaryColor,
                        py: 1.3,
                        px: 4.5,
                        fontWeight: 700,
                        fontSize: '1rem',
                        borderRadius: '10px',
                        boxShadow: `0 8px 24px ${primaryColor}40`,
                      }}
                    >
                      {submittingVitals ? (
                        <>
                          <CircularProgress size={22} color="inherit" sx={{ mr: 1.5 }} />
                          Submitting Vitals...
                        </>
                      ) : (
                        'SUBMIT'
                      )}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </LiquidGlassCard>
        </Box>
      )}

      {/* Camera QR Scanner Modal */}
      <QRScannerModal
        open={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />
    </Box>
  );
};
