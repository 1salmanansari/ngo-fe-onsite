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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  Breadcrumbs,
  Link,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import ScienceIcon from '@mui/icons-material/Science';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SendIcon from '@mui/icons-material/Send';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { QRScannerModal } from '../vitals/QRScannerModal';
import { useLiquidTheme } from '../../contexts/ThemeContext';
import { useVolunteer } from '../../contexts/VolunteerContext';
import { useToast } from '../../contexts/ToastContext';
import {
  searchPatientsApi,
  getPatientByIdApi,
  fetchDoctorsApi,
  fetchDepartmentsApi,
  fetchTestsApi,
  prescribeTestsApi,
  formatDoctorDisplay,
} from '../../utils/api';
import { Department, DiagnosisTest, Doctor, Patient } from '../../types';

export const TestsModule: React.FC = () => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const { primaryColor } = useLiquidTheme();
  const { incrementPatientCount } = useVolunteer();
  const { showToast } = useToast();

  const [activeView, setActiveView] = useState<'cards' | 'search' | 'form'>('cards');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Search autocomplete
  const [searchInput, setSearchInput] = useState('');
  const [searchOptions, setSearchOptions] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // QR Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Doctors & Tests catalogs
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableTests, setAvailableTests] = useState<DiagnosisTest[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  const [errorDoctor, setErrorDoctor] = useState<string | null>(null);
  const [errorTests, setErrorTests] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctorsApi().then((docs) => setDoctors(docs));
    fetchDepartmentsApi().then((depts) => setDepartments(depts));
    fetchTestsApi().then((tests) => setAvailableTests(tests));
  }, []);

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
    if (patient.doctorId) {
      setSelectedDoctorId(patient.doctorId);
    } else {
      setSelectedDoctorId('');
    }
    setSelectedTestIds([]);
    setErrorDoctor(null);
    setErrorTests(null);
    setActiveView('form');
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
    setSelectedDoctorId('');
    setSelectedTestIds([]);
    setErrorDoctor(null);
    setErrorTests(null);
    setSearchInput('');
    setSearchOptions([]);
    if (isMobile) {
      setActiveView('cards');
    } else {
      setActiveView('search');
    }
  };

  const validate = (): boolean => {
    let isValid = true;
    if (!selectedDoctorId) {
      setErrorDoctor('Please select a prescribing doctor');
      isValid = false;
    } else {
      setErrorDoctor(null);
    }

    if (selectedTestIds.length === 0) {
      setErrorTests('Please select at least one diagnostic test');
      isValid = false;
    } else {
      setErrorTests(null);
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !validate()) {
      showToast('Please select doctor and diagnostic tests', 'ALERT');
      return;
    }

    setSubmitting(true);
    try {
      await prescribeTestsApi({
        patientId: selectedPatient.patientId,
        doctorId: Number(selectedDoctorId),
        data: selectedTestIds,
      });

      showToast(
        `${selectedTestIds.length} Diagnostic Tests prescribed for Patient #${selectedPatient.patientId}!`,
        'SUCCESS'
      );
      incrementPatientCount();
      handleReset();
    } catch (err: any) {
      showToast(err.message || 'Failed to prescribe tests', 'ERROR');
    } finally {
      setSubmitting(false);
    }
  };

  // Strip uuid suffixes if present (e.g. LIPID Profile-7086 -> LIPID Profile)
  const cleanTestName = (name: string) => name.replace(/-[0-9a-f]{4,}$/i, '');

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
              bgcolor: `${primaryColor}14`,
              color: primaryColor,
              mb: 1.5,
            }}
          >
            <ScienceIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Tests & Diagnostics Counter
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, px: 2 }}>
            Scan patient QR or search by name to order laboratory investigations.
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
              bgcolor: `${primaryColor}14`,
              color: primaryColor,
              mb: 1,
            }}
          >
            <SearchIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Search Patient for Diagnostic Tests
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

      {/* 3. Tests Prescription Form */}
      {activeView === 'form' && selectedPatient && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
              Tests Counter
            </Link>
            <Typography sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.85rem' }}>
              {selectedPatient.name} (#{String(selectedPatient.patientId).padStart(3, '0')})
            </Typography>
          </Breadcrumbs>

          {/* Patient Header Summary */}
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

          {/* Tests Form Card */}
          <LiquidGlassCard sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <form onSubmit={handleSubmit} noValidate>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Prescribe Diagnostic & Laboratory Tests
              </Typography>

              <Grid container spacing={2.5}>
                {/* Doctor Selection Dropdown */}
                <Grid item xs={12}>
                  <FormControl fullWidth required error={Boolean(errorDoctor)}>
                    <InputLabel id="test-doc-label">Prescribing Doctor</InputLabel>
                    <Select
                      labelId="test-doc-label"
                      label="Prescribing Doctor"
                      value={selectedDoctorId}
                      onChange={(e) => {
                        setSelectedDoctorId(Number(e.target.value));
                        if (errorDoctor) setErrorDoctor(null);
                      }}
                      disabled={submitting || Boolean(selectedPatient.doctorId)}
                    >
                      {doctors.map((doc) => (
                        <MenuItem key={doc.id} value={doc.doctorId}>
                          {formatDoctorDisplay(doc, departments)}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {errorDoctor ||
                        (selectedPatient.doctorId
                          ? 'Assigned Doctor: Pre-selected from triage consultation'
                          : 'Select doctor to assign to this patient profile')}
                    </FormHelperText>
                  </FormControl>
                </Grid>

                {/* Searchable Multi-Select Autocomplete for Diagnostic Tests */}
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    id="tests-search-autocomplete"
                    options={availableTests}
                    disableCloseOnSelect
                    getOptionLabel={(option) => cleanTestName(option.name)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={availableTests.filter((t) => selectedTestIds.includes(t.id))}
                    onChange={(_, newValue) => {
                      setSelectedTestIds(newValue.map((item) => item.id));
                      if (errorTests) setErrorTests(null);
                    }}
                    renderOption={(props, option, { selected }) => (
                      <li {...props} key={option.id}>
                        <Checkbox
                          icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                          checkedIcon={<CheckBoxIcon fontSize="small" />}
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        <Typography variant="body2">{cleanTestName(option.name)}</Typography>
                      </li>
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={option.id}
                          label={cleanTestName(option.name)}
                          size="small"
                          sx={{ borderRadius: '6px', fontWeight: 600 }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Diagnostic Tests *"
                        placeholder={
                          selectedTestIds.length === 0 ? 'Type to search tests from catalog...' : ''
                        }
                        error={Boolean(errorTests)}
                        helperText={
                          errorTests ||
                          `${selectedTestIds.length} tests selected (Search by name or scroll list)`
                        }
                      />
                    )}
                    noOptionsText="No matching diagnostic tests found"
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
                      onClick={handleReset}
                      disabled={submitting}
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
                      disabled={submitting}
                      startIcon={!submitting && <SendIcon />}
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
                      {submitting ? (
                        <>
                          <CircularProgress size={22} color="inherit" sx={{ mr: 1.5 }} />
                          Prescribing Tests...
                        </>
                      ) : (
                        'SUBMIT TESTS'
                      )}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </LiquidGlassCard>
        </Box>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        open={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />
    </Box>
  );
};
