'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Rating,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import { useLiquidTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { ratePatientApi } from '../../utils/api';
import { Patient } from '../../types';

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  patient?: Patient | null;
  onSubmitted?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  open,
  onClose,
  patient,
  onSubmitted,
}) => {
  const { primaryColor, liquidGlass } = useLiquidTheme();
  const { showToast } = useToast();

  const [rating, setRating] = useState<number>(10);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    setRating(10);
    setFeedback('');
  }, [patient, open]);

  const getRatingLabel = (score: number) => {
    if (score >= 10) return '10 / 10 - Outstanding Experience ⭐';
    if (score >= 8) return `${score} / 10 - Very Good Care 👍`;
    if (score >= 6) return `${score} / 10 - Satisfactory Care 🙂`;
    if (score >= 4) return `${score} / 10 - Needs Improvement ⚠️`;
    return `${score} / 10 - Poor Experience ❌`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetPatientId = patient?.patientId || (patient as any)?.id;
    if (!targetPatientId) {
      showToast('Please select a patient first to submit a rating.', 'ALERT');
      return;
    }

    const pidNumber = Number(targetPatientId);

    // Fire non-blocking request to PATCH /unauth/patients/:id - do not wait for response
    ratePatientApi(pidNumber, rating, feedback.trim() || undefined).catch(() => {});

    // Instant toast notification for 2 seconds
    showToast(`Rating of ${rating}/10 submitted for Patient #${targetPatientId}!`, 'SUCCESS');

    // Close instantly, reset toggle and initial UI
    onClose();
    if (onSubmitted) onSubmitted();

    setRating(10);
    setFeedback('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
        {/* Header with Close */}
        <DialogTitle
          sx={{
            m: 0,
            p: 0,
            pb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                display: 'inline-flex',
                p: 1,
                borderRadius: '10px',
                bgcolor: '#f59e0b18',
                color: '#f59e0b',
              }}
            >
              <VolunteerActivismIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Patient Experience & Rating
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {patient
                  ? `Patient: ${patient.name} (#${patient.patientId})`
                  : 'Record Camp Rating & Feedback'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 0, py: 1.5, overflow: 'visible' }}>
          {/* Rating Stars Section */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              bgcolor: 'background.paper',
              border: '1px solid rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}
            >
              RATE FROM 1 - 10
            </Typography>

            {/* Large Interactive 1 - 10 Stars */}
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <Rating
                name="patient-care-rating"
                value={rating}
                max={10}
                onChange={(_, newValue) => {
                  if (newValue !== null && newValue >= 1) setRating(newValue);
                }}
                size="large"
                sx={{
                  color: '#f59e0b',
                  fontSize: { xs: '1.75rem', sm: '2.2rem' },
                  '& .MuiRating-icon': {
                    mx: { xs: 0.2, sm: 0.3 },
                  },
                }}
              />
            </Box>

            {/* Score Label */}
            <Typography variant="body2" sx={{ fontWeight: 800, mt: 1.5, color: '#f59e0b' }}>
              {getRatingLabel(rating)}
            </Typography>
          </Box>

          {/* Feedback Field (Optional) */}
          <TextField
            label="Comments / Feedback (Optional)"
            placeholder="Share doctor appreciation, service feedback, or notes..."
            multiline
            rows={2.5}
            fullWidth
            value={feedback}
            onChange={(e) => setFeedback(e.target.value.slice(0, 300))}
            sx={{ mt: 2.5 }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 0, pt: 1, gap: 1.5 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            size="medium"
            sx={{
              borderRadius: '10px',
              px: 3,
              fontWeight: 600,
              color: 'text.secondary',
              borderColor: 'rgba(0,0,0,0.2)',
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="medium"
            startIcon={<StarIcon />}
            sx={{
              bgcolor: primaryColor,
              px: 3.5,
              fontWeight: 700,
              borderRadius: '10px',
              boxShadow: `0 4px 14px ${primaryColor}40`,
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
