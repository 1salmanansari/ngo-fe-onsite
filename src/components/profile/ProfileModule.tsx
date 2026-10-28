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
  IconButton,
  Divider,
  Breadcrumbs,
  Link,
  FormControl,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import SpeedIcon from '@mui/icons-material/Speed';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HeightIcon from '@mui/icons-material/Height';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { QRScannerModal } from '../vitals/QRScannerModal';
import { RatingModal } from './RatingModal';
import { useLiquidTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { useSubdomain } from '../../contexts/SubdomainContext';
import {
  searchPatientsApi,
  getPatientByIdApi,
  updatePatientVitalsApi,
  fetchDoctorsApi,
  fetchDepartmentsApi,
  updatePatientDoctorApi,
  formatDoctorDisplay,
} from '../../utils/api';
import { Department, Doctor, IVitals, Patient } from '../../types';

export const ProfileModule: React.FC = () => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const { primaryColor } = useLiquidTheme();
  const { showToast } = useToast();
  const { profileTab, setProfileTab } = useSubdomain();

  const [activeView, setActiveView] = useState<'cards' | 'search' | 'details'>('cards');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Search autocomplete state with 500ms debounce
  const [searchInput, setSearchInput] = useState('');
  const [searchOptions, setSearchOptions] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // QR Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Rating Modal state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Doctors & Departments catalogs
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAssigningDoctor, setIsAssigningDoctor] = useState(false);
  const [doctorToAssign, setDoctorToAssign] = useState<number | ''>('');
  const [savingDoctor, setSavingDoctor] = useState(false);

  // Edit Vitals Inline State
  const [isEditingVitals, setIsEditingVitals] = useState(false);
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState<number | ''>('');
  const [temperature, setTemperature] = useState<number | ''>('');
  const [spo2, setSpo2] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [savingVitals, setSavingVitals] = useState(false);

  useEffect(() => {
    fetchDoctorsApi().then((docs) => setDoctors(docs));
    fetchDepartmentsApi().then((depts) => setDepartments(depts));
  }, []);

  useEffect(() => {
    if (profileTab === 'Rating') {
      setIsRatingModalOpen(true);
    }
  }, [profileTab]);

  useEffect(() => {
    if (!isMobile && activeView === 'cards') {
      setActiveView('search');
    }
  }, [isMobile, activeView]);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
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
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchInput]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    if (profileTab === 'Rating') {
      // In Rating mode: opening rating modal for this selected patient
      setIsRatingModalOpen(true);
    } else {
      // In Profile mode: display patient medical chart and vitals
      setIsEditingVitals(false);
      setIsAssigningDoctor(false);
      setDoctorToAssign(patient.doctorId || '');
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
      setActiveView('details');
    }
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

  const handleReset = () => {
    setSelectedPatient(null);
    setIsEditingVitals(false);
    setIsAssigningDoctor(false);
    setSearchInput('');
    setSearchOptions([]);
    if (isMobile) {
      setActiveView('cards');
    } else {
      setActiveView('search');
    }
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setSavingVitals(true);
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

      setSelectedPatient(updated);
      setIsEditingVitals(false);
      showToast(`Vitals updated for Patient #${updated.patientId}`, 'SUCCESS');
    } catch (err: any) {
      showToast(err.message || 'Failed to update vitals', 'ERROR');
    } finally {
      setSavingVitals(false);
    }
  };

  const handleSaveDoctor = async () => {
    if (!selectedPatient || !doctorToAssign) return;
    setSavingDoctor(true);
    try {
      await updatePatientDoctorApi(
        selectedPatient.patientId || selectedPatient.id,
        Number(doctorToAssign)
      );
      setSelectedPatient((prev) => (prev ? { ...prev, doctorId: Number(doctorToAssign) } : null));
      setIsAssigningDoctor(false);
      showToast('Assigned Doctor updated successfully', 'SUCCESS');
    } catch (err: any) {
      showToast(err.message || 'Failed to assign doctor', 'ERROR');
    } finally {
      setSavingDoctor(false);
    }
  };

  const hasAnyVitals = Boolean(
    selectedPatient?.vitals &&
    (selectedPatient.vitals.bp ||
      selectedPatient.vitals.pulse ||
      selectedPatient.vitals.tempreture ||
      selectedPatient.vitals.spo2 ||
      selectedPatient.vitals.weight ||
      selectedPatient.vitals.height)
  );

  // Resolve readable department name without UUID
  const getReadableDepartment = (rawDept?: string) => {
    if (!rawDept) return 'General Medicine & OPD';
    const match = departments.find((d) => d.id === rawDept || d.name === rawDept);
    if (match) return match.name;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawDept);
    return isUuid ? 'General Medicine & OPD' : rawDept;
  };

  // Resolve doctor display name
  const getAssignedDoctorName = (doctorId?: number) => {
    if (!doctorId) return 'Not yet assigned';
    const doc = doctors.find((d) => d.doctorId === doctorId);
    if (!doc) return `Doctor #${doctorId}`;
    return formatDoctorDisplay(doc, departments);
  };

  const isRatingMode = profileTab === 'Rating';

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      {/* 1. Mobile Cards View */}
      {isMobile && activeView === 'cards' && (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 1.5,
              borderRadius: '12px',
              bgcolor: isRatingMode ? '#f59e0b18' : `${primaryColor}14`,
              color: isRatingMode ? '#f59e0b' : primaryColor,
              mb: 1.5,
            }}
          >
            {isRatingMode ? (
              <StarIcon sx={{ fontSize: 32 }} />
            ) : (
              <PersonIcon sx={{ fontSize: 32 }} />
            )}
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {isRatingMode ? 'Patient Experience & Rating' : 'Patient Profile & Waiting Counter'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, px: 2 }}>
            {isRatingMode
              ? 'Scan patient QR or search by name to record experience rating.'
              : 'Scan patient QR or search by name to view complete medical chart and vitals.'}
          </Typography>

          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, px: 1 }}
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

      {/* 2. Search Autocomplete View */}
      {activeView === 'search' && (
        <LiquidGlassCard sx={{ p: { xs: 2.5, sm: 4 }, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 1.5,
              borderRadius: '12px',
              bgcolor: isRatingMode ? '#f59e0b18' : `${primaryColor}14`,
              color: isRatingMode ? '#f59e0b' : primaryColor,
              mb: 1,
            }}
          >
            {isRatingMode ? (
              <StarIcon sx={{ fontSize: 36 }} />
            ) : (
              <SearchIcon sx={{ fontSize: 36 }} />
            )}
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {isRatingMode ? 'Patient Experience & Rating' : 'Search Patient Profile'}
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
                    sx: { borderRadius: '12px', py: 0.6, fontSize: '0.95rem' },
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
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px' }}
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
              sx={{ borderRadius: '10px', color: primaryColor, borderColor: `${primaryColor}55` }}
            >
              Scan Patient QR Code Instead
            </Button>
          </Box>
        </LiquidGlassCard>
      )}

      {/* 3. Patient Profile Details View (Profile Tab & Rating Mode) */}
      {activeView === 'details' && selectedPatient && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Breadcrumbs Navigation */}
          <Breadcrumbs
            separator={<NavigateNextIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
            aria-label="breadcrumb"
          >
            <Link
              component="button"
              type="button"
              onClick={handleReset}
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
              Patient Directory
            </Link>
            <Typography sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.85rem' }}>
              {selectedPatient.name} (#{String(selectedPatient.patientId).padStart(3, '0')})
            </Typography>
          </Breadcrumbs>

          {/* Patient Details Card */}
          <LiquidGlassCard sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: primaryColor }}>
                    {selectedPatient.name}
                  </Typography>
                  <Chip
                    label={`Patient #${String(selectedPatient.patientId).padStart(3, '0')}`}
                    color="primary"
                    sx={{ fontWeight: 800, borderRadius: '6px' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
                  Registered Camp Record &bull; Entry ID: {selectedPatient.patientId}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2.5}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Age / Gender
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {selectedPatient.age} Yrs / {selectedPatient.gender}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Mobile Number
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {selectedPatient.mobile}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Department
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {getReadableDepartment(selectedPatient.department)}
                </Typography>
              </Grid>

              {/* Assigned Doctor with direct Assign / Change capability */}
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Assigned Doctor
                </Typography>
                {!isAssigningDoctor ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: selectedPatient.doctorId ? primaryColor : 'text.secondary',
                      }}
                    >
                      {getAssignedDoctorName(selectedPatient.doctorId)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setIsAssigningDoctor(true)}
                      sx={{ color: primaryColor, p: 0.4 }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flex: 1 }}>
                    <Autocomplete
                      size="small"
                      fullWidth
                      options={doctors}
                      getOptionLabel={(doc) => formatDoctorDisplay(doc, departments)}
                      value={doctors.find((d) => d.doctorId === doctorToAssign) || null}
                      onChange={(_, newVal) => {
                        setDoctorToAssign(newVal ? newVal.doctorId : '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search doctor by name, degree, or ID..."
                          autoFocus
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                            },
                          }}
                        />
                      )}
                    />
                    <IconButton
                      size="small"
                      onClick={handleSaveDoctor}
                      disabled={savingDoctor || !doctorToAssign}
                      sx={{ color: primaryColor, p: 0.5 }}
                    >
                      {savingDoctor ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SaveIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setIsAssigningDoctor(false)}
                      sx={{ color: 'text.secondary', p: 0.5 }}
                    >
                      <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Chief Complaint
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    bgcolor: `${primaryColor}0a`,
                    p: 1.5,
                    borderRadius: '10px',
                    border: `1px solid ${primaryColor}1a`,
                    mt: 0.5,
                  }}
                >
                  {selectedPatient.complaint}
                </Typography>
              </Grid>

              {selectedPatient.address && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Address
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
                    {selectedPatient.address}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </LiquidGlassCard>

          {/* Vitals Section */}
          <LiquidGlassCard sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MonitorHeartIcon sx={{ color: primaryColor }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Patient Vitals
                </Typography>
              </Box>

              {!isEditingVitals && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditingVitals(true)}
                  sx={{
                    borderRadius: '8px',
                    borderColor: `${primaryColor}55`,
                    color: primaryColor,
                  }}
                >
                  {hasAnyVitals ? 'Edit Vitals' : 'Record Vitals'}
                </Button>
              )}
            </Box>

            {!isEditingVitals ? (
              hasAnyVitals ? (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: `${primaryColor}08`,
                        border: `1px solid ${primaryColor}1a`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontWeight: 600 }}
                      >
                        Blood Pressure
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 800, color: primaryColor, mt: 0.5 }}
                      >
                        {selectedPatient.vitals?.bp || 'Not recorded'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: `${primaryColor}08`,
                        border: `1px solid ${primaryColor}1a`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontWeight: 600 }}
                      >
                        Pulse Rate
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 800, color: primaryColor, mt: 0.5 }}
                      >
                        {selectedPatient.vitals?.pulse
                          ? `${selectedPatient.vitals.pulse} bpm`
                          : 'Not recorded'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: `${primaryColor}08`,
                        border: `1px solid ${primaryColor}1a`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontWeight: 600 }}
                      >
                        Body Temperature
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 800, color: primaryColor, mt: 0.5 }}
                      >
                        {selectedPatient.vitals?.tempreture
                          ? `${selectedPatient.vitals.tempreture} °F`
                          : 'Not recorded'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: `${primaryColor}08`,
                        border: `1px solid ${primaryColor}1a`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontWeight: 600 }}
                      >
                        SPO2 (Oxygen)
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 800, color: primaryColor, mt: 0.5 }}
                      >
                        {selectedPatient.vitals?.spo2
                          ? `${selectedPatient.vitals.spo2} %`
                          : 'Not recorded'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: `${primaryColor}08`,
                        border: `1px solid ${primaryColor}1a`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontWeight: 600 }}
                      >
                        Weight
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 800, color: primaryColor, mt: 0.5 }}
                      >
                        {selectedPatient.vitals?.weight
                          ? `${selectedPatient.vitals.weight} kg`
                          : 'Not recorded'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={4}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: `${primaryColor}08`,
                        border: `1px solid ${primaryColor}1a`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', fontWeight: 600 }}
                      >
                        Height
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 800, color: primaryColor, mt: 0.5 }}
                      >
                        {selectedPatient.vitals?.height
                          ? `${selectedPatient.vitals.height} cm`
                          : 'Not recorded'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    borderRadius: '12px',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No vitals record found for this patient.
                  </Typography>
                </Box>
              )
            ) : (
              <form onSubmit={handleSaveVitals} noValidate>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Blood Pressure"
                      placeholder="e.g. 120/80"
                      fullWidth
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      disabled={savingVitals}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Pulse Rate (bpm)"
                      placeholder="e.g. 72"
                      fullWidth
                      type="number"
                      value={pulse}
                      onChange={(e) =>
                        setPulse(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      disabled={savingVitals}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Body Temperature (°F)"
                      placeholder="e.g. 98.6"
                      fullWidth
                      type="number"
                      value={temperature}
                      onChange={(e) =>
                        setTemperature(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      disabled={savingVitals}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="SPO2 Oxygen Saturation (%)"
                      placeholder="e.g. 98"
                      fullWidth
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value === '' ? '' : Number(e.target.value))}
                      disabled={savingVitals}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Weight (kg)"
                      placeholder="e.g. 68"
                      fullWidth
                      type="number"
                      value={weight}
                      onChange={(e) =>
                        setWeight(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      disabled={savingVitals}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Height (cm)"
                      placeholder="e.g. 175"
                      fullWidth
                      type="number"
                      value={height}
                      onChange={(e) =>
                        setHeight(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      disabled={savingVitals}
                    />
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => setIsEditingVitals(false)}
                      disabled={savingVitals}
                      sx={{ borderRadius: '10px' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={savingVitals}
                      startIcon={!savingVitals && <SaveIcon />}
                      sx={{ bgcolor: primaryColor, borderRadius: '10px', px: 3 }}
                    >
                      {savingVitals ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Save Vitals'
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
          </LiquidGlassCard>
        </Box>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        open={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />

      {/* Rating Modal */}
      <RatingModal
        open={isRatingModalOpen}
        onClose={() => {
          setIsRatingModalOpen(false);
          setProfileTab('Profile');
        }}
        patient={selectedPatient}
        onSubmitted={() => {
          setIsRatingModalOpen(false);
          setProfileTab('Profile');
        }}
      />
    </Box>
  );
};
