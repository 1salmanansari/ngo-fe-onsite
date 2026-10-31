'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  ToggleButtonGroup,
  ToggleButton,
  FormHelperText,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SendIcon from '@mui/icons-material/Send';
import WcIcon from '@mui/icons-material/Wc';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { LiquidGlassCard } from '../common/LiquidGlassCard';
import { SuccessModal } from './SuccessModal';
import { useLiquidTheme } from '../../contexts/ThemeContext';
import { useVolunteer } from '../../contexts/VolunteerContext';
import { useToast } from '../../contexts/ToastContext';
import { calculateAgeFromDob } from '../../utils/ageCalculator';
import { generatePatientQrDataUrl } from '../../utils/qrGenerator';
import { openLetterPadInNewTab } from '../../utils/letterPadTemplate';
import { registerPatientApi, fetchDepartmentsApi } from '../../utils/api';
import { Department, Patient } from '../../types';

interface RegistrationModuleProps {
  initialDepartments?: Department[];
}

export const RegistrationModule: React.FC<RegistrationModuleProps> = ({
  initialDepartments = [],
}) => {
  const { primaryColor } = useLiquidTheme();
  const { volunteer, incrementPatientCount } = useVolunteer();
  const { showToast } = useToast();

  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [age, setAge] = useState<string>('');
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHERS'>('MALE');
  const [address, setAddress] = useState('');
  const [complaint, setComplaint] = useState('');
  const [department, setDepartment] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [submitting, setSubmitting] = useState(false);

  // Success State & Printable QR
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);
  const [lastQrDataUrl, setLastQrDataUrl] = useState<string>('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Fetch departments if not passed from server
  useEffect(() => {
    if (initialDepartments.length === 0) {
      setLoadingDepartments(true);
      fetchDepartmentsApi()
        .then((data) => {
          setDepartments(data);
          if (data.length > 0) {
            setDepartment((prev) => prev || data[0].name || data[0].id);
          }
        })
        .finally(() => setLoadingDepartments(false));
    } else if (initialDepartments.length > 0) {
      setDepartment((prev) => prev || initialDepartments[0].name || initialDepartments[0].id);
    }
  }, [initialDepartments]);

  // Handle DOB change -> automatically calculate and disable Age field
  const handleDobChange = (newValue: Dayjs | null) => {
    setDob(newValue);
    if (newValue && newValue.isValid()) {
      const { age: calcAge, error: dobErr } = calculateAgeFromDob(newValue);
      if (dobErr) {
        setErrors((prev) => ({ ...prev, dob: dobErr }));
      } else if (calcAge !== null) {
        setAge(calcAge.toString());
        setErrors((prev) => ({ ...prev, dob: null, age: null }));
      }
    } else {
      setErrors((prev) => ({ ...prev, dob: null }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string | null } = {};
    let isValid = true;

    // Name: min 3, max 50
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 3) {
      newErrors.name = 'Patient Name must be at least 3 characters';
      isValid = false;
    } else if (trimmedName.length > 50) {
      newErrors.name = 'Patient Name cannot exceed 50 characters';
      isValid = false;
    }

    // Age: mandatory, max 3 digits
    const parsedAge = parseInt(age, 10);
    if (!age || isNaN(parsedAge) || parsedAge < 0 || parsedAge > 125) {
      newErrors.age = 'Enter a valid age (0 - 125)';
      isValid = false;
    }

    // DOB validation check if entered
    if (dob) {
      const { error: dobErr } = calculateAgeFromDob(dob);
      if (dobErr) {
        newErrors.dob = dobErr;
        isValid = false;
      }
    }

    // Mobile: 10 digits
    if (!mobile || !/^[0-9]{10}$/.test(mobile.trim())) {
      newErrors.mobile = 'Mobile number must be exactly 10 digits';
      isValid = false;
    }

    // Complaint: min 3, max 500
    const trimmedComplaint = complaint.trim();
    if (!trimmedComplaint || trimmedComplaint.length < 3) {
      newErrors.complaint = 'Complaint must be at least 3 characters';
      isValid = false;
    } else if (trimmedComplaint.length > 500) {
      newErrors.complaint = 'Complaint cannot exceed 500 characters';
      isValid = false;
    }

    // Address: max 300
    if (address && address.length > 300) {
      newErrors.address = 'Address cannot exceed 300 characters';
      isValid = false;
    }

    // Department: mandatory
    if (!department) {
      newErrors.department = 'Please select a disease department';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleReset = () => {
    setName('');
    setAge('');
    setDob(null);
    setMobile('');
    setGender('MALE');
    setAddress('');
    setComplaint('');
    if (departments.length > 0) {
      setDepartment(departments[0].id);
    }
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix validation errors before submitting', 'ALERT');
      return;
    }

    setSubmitting(true);
    try {
      const authorId = volunteer?.id || volunteer?.username || 'self_patient';
      const payload: Partial<Patient> = {
        name: name.trim(),
        age: parseInt(age, 10),
        dob: dob && dob.isValid() ? dob.valueOf() : undefined,
        mobile: mobile.trim(),
        gender,
        address: address.trim(),
        complaint: complaint.trim(),
        department,
        author: authorId,
      };

      const responsePatient = await registerPatientApi(payload);

      // 5. Generate QR Code using details: { name, patientId, age }
      const qrDataUrl = await generatePatientQrDataUrl({
        name: responsePatient.name,
        patientId: responsePatient.patientId,
        age: responsePatient.age,
      });

      setRegisteredPatient(responsePatient);
      setLastQrDataUrl(qrDataUrl);
      incrementPatientCount();

      // 6 & 7. Append QR Code onto Template and open in next browser tab with print dialog
      const deptObj = departments.find(
        (d) => d.id === responsePatient.department || d.name === responsePatient.department
      );
      const resolvedDeptName = deptObj
        ? deptObj.name
        : responsePatient.department || 'General Medicine & OPD';
      const patientForSlip: Patient = {
        ...responsePatient,
        department: resolvedDeptName,
      };

      openLetterPadInNewTab(patientForSlip, qrDataUrl);

      // 8. Open Success Modal on current tab
      setIsSuccessModalOpen(true);
      showToast(`Patient #${responsePatient.patientId} registered successfully!`, 'SUCCESS');
    } catch (err: any) {
      showToast(err.message || 'Failed to register patient. Try again.', 'ERROR');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCasePaper = () => {
    if (registeredPatient && lastQrDataUrl) {
      openLetterPadInNewTab(registeredPatient, lastQrDataUrl);
    }
  };

  const handleAddNewPatient = () => {
    setIsSuccessModalOpen(false);
    handleReset();
  };

  const isDobActive = Boolean(dob && dob.isValid());

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ maxWidth: 900, mx: 'auto', py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <LiquidGlassCard sx={{ p: { xs: 2.5, sm: 4 } }}>
          {/* Header Title */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Box
              sx={{
                display: 'inline-flex',
                p: 1.2,
                borderRadius: '50%',
                bgcolor: `${primaryColor}14`,
                color: primaryColor,
                mb: 1,
              }}
            >
              <AssignmentIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Patient Registration Counter
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Register walking-in patients, generate sequential ID & printable OPD slip.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2.5}>
              {/* Patient Name */}
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Patient Name"
                  placeholder="e.g. Salman Ansari"
                  required
                  fullWidth
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  error={Boolean(errors.name)}
                  helperText={errors.name || 'Min 3 and max 50 characters'}
                  disabled={submitting}
                />
              </Grid>

              {/* Patient Gender Toggle */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.8 }}
                  >
                    Patient Sex *
                  </Typography>
                  <ToggleButtonGroup
                    value={gender}
                    exclusive
                    onChange={(_, val) => val && setGender(val)}
                    fullWidth
                    disabled={submitting}
                    sx={{
                      height: 52,
                      borderRadius: '10px',
                      p: '3px',
                      bgcolor: 'background.paper',
                      border: '1px solid rgba(0,0,0,0.12)',
                      '& .MuiToggleButton-root': {
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        borderRadius: '8px !important',
                        border: 'none',
                        color: 'text.secondary',
                        '&.Mui-selected': {
                          bgcolor: `${primaryColor}22`,
                          color: primaryColor,
                          fontWeight: 800,
                        },
                      },
                    }}
                  >
                    <ToggleButton value="MALE">Male</ToggleButton>
                    <ToggleButton value="FEMALE">Female</ToggleButton>
                    <ToggleButton value="OTHERS">Others</ToggleButton>
                  </ToggleButtonGroup>
                </FormControl>
              </Grid>

              {/* Patient Date of Birth (Optional) */}
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Patient Date of Birth"
                  value={dob}
                  onChange={handleDobChange}
                  maxDate={dayjs()} // future dates won't be selected
                  minDate={dayjs().subtract(120, 'year')} // max 120 years past date
                  disabled={submitting}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      placeholder: 'DD/MM/YYYY',
                      error: Boolean(errors.dob),
                      helperText: errors.dob || 'Optional: auto-calculates and locks age',
                    },
                  }}
                />
              </Grid>

              {/* Patient Age (Mandatory) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Patient Age"
                  placeholder="e.g. 31"
                  required
                  fullWidth
                  type="number"
                  value={age}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 3);
                    setAge(val);
                    if (errors.age) setErrors((prev) => ({ ...prev, age: null }));
                  }}
                  error={Boolean(errors.age)}
                  helperText={
                    errors.age ||
                    (isDobActive ? 'Calculated automatically from DOB' : 'Max 3 digits (e.g. 31)')
                  }
                  disabled={submitting || isDobActive}
                />
              </Grid>

              {/* Patient Mobile Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Patient Mobile Number"
                  placeholder="10 digit mobile number"
                  required
                  fullWidth
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobile(val);
                    if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: null }));
                  }}
                  error={Boolean(errors.mobile)}
                  helperText={errors.mobile || '10 digit mobile number'}
                  disabled={submitting}
                />
              </Grid>

              {/* Disease Department (Searchable Autocomplete) */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  id="disease-department-autocomplete"
                  options={departments}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.name || ''
                  }
                  isOptionEqualToValue={(option, val) => {
                    if (!val) return false;
                    const optVal = typeof option === 'string' ? option : option.name || option.id;
                    const checkVal = typeof val === 'string' ? val : val.name || val.id;
                    return optVal === checkVal;
                  }}
                  value={
                    departments.find((d) => d.name === department || d.id === department) ||
                    (department ? { id: department, name: department } : null)
                  }
                  onChange={(_, newValue) => {
                    const selectedName = newValue
                      ? typeof newValue === 'string'
                        ? newValue
                        : newValue.name || newValue.id
                      : '';
                    setDepartment(selectedName);
                    if (errors.department) setErrors((prev) => ({ ...prev, department: null }));
                  }}
                  disabled={submitting || loadingDepartments}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Disease Department"
                      placeholder="Search target medical department..."
                      required
                      error={Boolean(errors.department)}
                      helperText={errors.department || 'Select target medical counter'}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <MedicalServicesIcon sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {loadingDepartments ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Patient Complaint */}
              <Grid item xs={12}>
                <TextField
                  label="Patient Complaint"
                  placeholder="Patient Complaint (e.g. facing slight pain in chest from 2 days)"
                  required
                  fullWidth
                  multiline
                  rows={3}
                  value={complaint}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 500);
                    setComplaint(val);
                    if (errors.complaint) setErrors((prev) => ({ ...prev, complaint: null }));
                  }}
                  error={Boolean(errors.complaint)}
                  helperText={
                    errors.complaint || `${complaint.length}/500 chars (Min 3 characters required)`
                  }
                  disabled={submitting}
                />
              </Grid>

              {/* Patient Address (Optional) */}
              <Grid item xs={12}>
                <TextField
                  label="Patient Address"
                  placeholder="Patient Address (Optional)"
                  fullWidth
                  multiline
                  rows={2}
                  value={address}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 300);
                    setAddress(val);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: null }));
                  }}
                  error={Boolean(errors.address)}
                  helperText={errors.address || `${address.length}/300 chars (Optional)`}
                  disabled={submitting}
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
                        Registering Patient...
                      </>
                    ) : (
                      'Submit Registration'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </LiquidGlassCard>

        {/* Post-Registration Success Modal with "Open Case Paper" & "Add New Patient" */}
        <SuccessModal
          open={isSuccessModalOpen}
          patient={registeredPatient}
          onOpenCasePaper={handleOpenCasePaper}
          onAddNewPatient={handleAddNewPatient}
        />
      </Box>
    </LocalizationProvider>
  );
};
