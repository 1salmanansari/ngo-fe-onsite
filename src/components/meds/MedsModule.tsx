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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Breadcrumbs,
  Link,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import MedicationIcon from '@mui/icons-material/Medication';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
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
  searchMedsApi,
  prescribeMedsApi,
  formatDoctorDisplay,
} from '../../utils/api';
import { Department, Doctor, Patient, PharmacyMed, PrescribeMedItem } from '../../types';

export const MedsModule: React.FC = () => {
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

  // Catalogs
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableMeds, setAvailableMeds] = useState<PharmacyMed[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');

  // Meds selection state
  const [activeMedSelection, setActiveMedSelection] = useState<PharmacyMed | null>(null);
  const [medQtyInput, setMedQtyInput] = useState<number>(10);
  const [selectedMedItems, setSelectedMedItems] = useState<PrescribeMedItem[]>([]);

  const [errorDoctor, setErrorDoctor] = useState<string | null>(null);
  const [errorMeds, setErrorMeds] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctorsApi().then((docs) => setDoctors(docs));
    fetchDepartmentsApi().then((depts) => setDepartments(depts));
    searchMedsApi().then((meds) => setAvailableMeds(meds));
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
    setSelectedMedItems([]);
    setActiveMedSelection(null);
    setMedQtyInput(10);
    setErrorDoctor(null);
    setErrorMeds(null);
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
    setSelectedMedItems([]);
    setActiveMedSelection(null);
    setMedQtyInput(10);
    setErrorDoctor(null);
    setErrorMeds(null);
    setSearchInput('');
    setSearchOptions([]);
    if (isMobile) {
      setActiveView('cards');
    } else {
      setActiveView('search');
    }
  };

  const handleAddMedItem = () => {
    if (!activeMedSelection) return;
    if (medQtyInput <= 0) return;

    const existingIndex = selectedMedItems.findIndex((m) => m.id === activeMedSelection.id);
    if (existingIndex >= 0) {
      const updated = [...selectedMedItems];
      updated[existingIndex].qty += medQtyInput;
      setSelectedMedItems(updated);
    } else {
      setSelectedMedItems([
        ...selectedMedItems,
        {
          id: activeMedSelection.id,
          name: activeMedSelection.name,
          qty: medQtyInput,
        },
      ]);
    }

    setActiveMedSelection(null);
    setMedQtyInput(10);
    setErrorMeds(null);
  };

  const handleRemoveMedItem = (id: string) => {
    setSelectedMedItems(selectedMedItems.filter((item) => item.id !== id));
  };

  const validate = (): boolean => {
    let isValid = true;
    if (!selectedDoctorId) {
      setErrorDoctor('Please select a prescribing doctor');
      isValid = false;
    } else {
      setErrorDoctor(null);
    }

    if (selectedMedItems.length === 0) {
      setErrorMeds('Please add at least one medication to dispense');
      isValid = false;
    } else {
      setErrorMeds(null);
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !validate()) {
      showToast('Please fix required validation fields', 'ALERT');
      return;
    }

    setSubmitting(true);
    try {
      await prescribeMedsApi({
        patientId: selectedPatient.patientId,
        doctorId: Number(selectedDoctorId),
        data: selectedMedItems.map((item) => ({ id: item.id, qty: item.qty })),
      });

      showToast(
        `${selectedMedItems.length} Medications dispensed for Patient #${selectedPatient.patientId}!`,
        'SUCCESS'
      );
      incrementPatientCount();
      handleReset();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit medications', 'ERROR');
    } finally {
      setSubmitting(false);
    }
  };

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
            <MedicationIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Pharmacy Counter Station
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, px: 2 }}>
            Scan patient QR or search by name to dispense prescribed medicines.
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
            Search Patient for Pharmacy Dispensation
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

      {/* 3. Meds Form View */}
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
              Pharmacy Counter
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

          {/* Meds Form Card */}
          <LiquidGlassCard sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <form onSubmit={handleSubmit} noValidate>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Dispense Prescribed Medications
              </Typography>

              <Grid container spacing={2.5}>
                {/* Doctor Selection Dropdown */}
                <Grid item xs={12}>
                  <FormControl fullWidth required error={Boolean(errorDoctor)}>
                    <InputLabel id="med-doc-label">Prescribing Doctor</InputLabel>
                    <Select
                      labelId="med-doc-label"
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

                {/* Medication Selector & Quantity Input */}
                <Grid item xs={12} sm={8}>
                  <Autocomplete
                    options={availableMeds}
                    getOptionLabel={(option) => `${option.name} (Stock: ${option.qty})`}
                    value={activeMedSelection}
                    onChange={(_, value) => setActiveMedSelection(value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Choose Medicine from Pharmacy"
                        placeholder="Search pharmacy drugs..."
                      />
                    )}
                    disabled={submitting}
                  />
                </Grid>

                <Grid item xs={8} sm={2}>
                  <TextField
                    label="Quantity"
                    type="number"
                    fullWidth
                    value={medQtyInput}
                    onChange={(e) => setMedQtyInput(Math.max(1, Number(e.target.value)))}
                    disabled={submitting || !activeMedSelection}
                  />
                </Grid>

                <Grid item xs={4} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleAddMedItem}
                    disabled={!activeMedSelection || submitting}
                    startIcon={<AddCircleOutlineIcon />}
                    sx={{ py: 1.7, borderRadius: '10px', fontWeight: 700 }}
                  >
                    Add
                  </Button>
                </Grid>

                {/* Prescribed Items Table */}
                <Grid item xs={12}>
                  {selectedMedItems.length === 0 ? (
                    <Box
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        bgcolor: 'background.paper',
                        borderRadius: '12px',
                        border: '1px dashed rgba(0,0,0,0.12)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: errorMeds ? 'error.main' : 'text.secondary' }}
                      >
                        {errorMeds ||
                          'No medications added yet. Select a medicine and click "Add".'}
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                      }}
                    >
                      <Table size="small">
                        <TableHead sx={{ bgcolor: `${primaryColor}0d` }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Medicine Name</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="center">
                              Quantity
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="right">
                              Action
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedMedItems.map((item, idx) => (
                            <TableRow key={item.id} hover>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>{item.name}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={`${item.qty} units`}
                                  size="small"
                                  sx={{ fontWeight: 700, borderRadius: '6px' }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveMedItem(item.id)}
                                  disabled={submitting}
                                  sx={{ color: 'error.main' }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
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
                          Dispensing Meds...
                        </>
                      ) : (
                        'DISPENSE MEDS'
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
