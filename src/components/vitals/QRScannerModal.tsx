'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Html5Qrcode } from 'html5-qrcode';
import { useLiquidTheme } from '../../contexts/ThemeContext';

interface QRScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (patientId: string | number) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ open, onClose, onScanSuccess }) => {
  const { primaryColor, liquidGlass } = useLiquidTheme();
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  onScanSuccessRef.current = onScanSuccess;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const readerElementId = 'html5-qr-reader-container';

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch {
      // ignore
    } finally {
      html5QrCodeRef.current = null;
      setScanning(false);
    }
  };

  const handleDecodedText = React.useCallback((decodedText: string) => {
    stopScanner();
    onCloseRef.current();

    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.patientId !== undefined) {
        onScanSuccessRef.current(parsed.patientId);
        return;
      }
    } catch {
      // not JSON, check if it's direct patient ID or URL
    }

    // Try extracting numeric ID
    const numMatch = decodedText.match(/\d+/);
    if (numMatch) {
      onScanSuccessRef.current(numMatch[0]);
    } else {
      onScanSuccessRef.current(decodedText);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    let isMounted = true;
    setScannerError(null);

    const startCamera = async () => {
      try {
        // Small delay to ensure DOM element is rendered
        await new Promise((r) => setTimeout(r, 200));
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode(readerElementId);
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleDecodedText(decodedText);
          },
          () => {
            // scan failure callback (ignored for continuous scanning)
          }
        );

        if (isMounted) setScanning(true);
      } catch (err: any) {
        if (isMounted) {
          setScannerError(
            err.message ||
              'Unable to access camera. Please allow camera permissions or upload an image file of the QR code.'
          );
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [open, handleDecodedText]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode(readerElementId);
      const decodedText = await html5QrCode.scanFile(file, true);
      handleDecodedText(decodedText);
    } catch (err: any) {
      setScannerError('Could not decode QR code from the uploaded image.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: liquidGlass.glassBg,
          backdropFilter: liquidGlass.backdropBlur,
          WebkitBackdropFilter: liquidGlass.backdropBlur,
          border: liquidGlass.glassBorder,
          boxShadow: liquidGlass.glassShadow,
          p: 2,
        },
      }}
    >
      <DialogTitle
        sx={{ m: 0, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeScannerIcon sx={{ color: primaryColor }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Scan Patient QR Code
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 1, mt: 1 }}>
        <Box
          id={readerElementId}
          sx={{
            width: '100%',
            minHeight: 260,
            borderRadius: 3,
            overflow: 'hidden',
            border: `2px dashed ${primaryColor}55`,
            bgcolor: 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />

        {scannerError && (
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
            {scannerError}
          </Alert>
        )}

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
            Position the QR code within the camera frame
          </Typography>

          <Button
            component="label"
            variant="outlined"
            size="small"
            startIcon={<UploadFileIcon />}
            sx={{ borderRadius: 2, borderColor: `${primaryColor}66`, color: primaryColor }}
          >
            Upload QR Image File
            <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 1 }}>
        <Button onClick={onClose} fullWidth variant="text" sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
