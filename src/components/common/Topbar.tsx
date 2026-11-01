'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Chip,
  Tooltip,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PaletteIcon from '@mui/icons-material/Palette';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import BiotechIcon from '@mui/icons-material/Biotech';
import MedicationIcon from '@mui/icons-material/Medication';
import StarIcon from '@mui/icons-material/Star';
import BadgeIcon from '@mui/icons-material/Badge';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useLiquidTheme } from '../../contexts/ThemeContext';
import { useVolunteer } from '../../contexts/VolunteerContext';
import { useSubdomain } from '../../contexts/SubdomainContext';
import { SubdomainType } from '../../types';

const MODULES: { id: SubdomainType; label: string; icon: React.ReactElement }[] = [
  { id: 'register', label: 'Register', icon: <HowToRegIcon sx={{ fontSize: '0.85rem' }} /> },
  { id: 'vitals', label: 'Vitals', icon: <MonitorHeartIcon sx={{ fontSize: '0.85rem' }} /> },
  { id: 'profile', label: 'Profile', icon: <AccountCircleIcon sx={{ fontSize: '0.85rem' }} /> },
  {
    id: 'referral',
    label: 'Referral',
    icon: <AssignmentTurnedInIcon sx={{ fontSize: '0.85rem' }} />,
  },
  { id: 'tests', label: 'Tests', icon: <BiotechIcon sx={{ fontSize: '0.85rem' }} /> },
  { id: 'meds', label: 'Meds', icon: <MedicationIcon sx={{ fontSize: '0.85rem' }} /> },
];

export const Topbar: React.FC = () => {
  const { mode, toggleMode, primaryColor, setPrimaryColor, liquidGlass } = useLiquidTheme();
  const { volunteer, patientCount } = useVolunteer();
  const { subdomain, setSubdomain, profileTab, setProfileTab } = useSubdomain();

  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const openProfileMenu = Boolean(profileMenuAnchor);

  const [moduleMenuAnchor, setModuleMenuAnchor] = useState<null | HTMLElement>(null);
  const openModuleMenu = Boolean(moduleMenuAnchor);

  const handleOpenProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setProfileMenuAnchor(null);
  };

  const handleOpenModuleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setModuleMenuAnchor(event.currentTarget);
  };

  const handleCloseModuleMenu = () => {
    setModuleMenuAnchor(null);
  };

  const volunteerInitials = volunteer?.name
    ? volunteer.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'V';

  const currentModule = MODULES.find((m) => m.id === subdomain) || MODULES[0];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: liquidGlass.glassBg,
        backdropFilter: liquidGlass.backdropBlur,
        WebkitBackdropFilter: liquidGlass.backdropBlur,
        borderBottom: liquidGlass.glassBorder,
        color: mode === 'dark' ? '#f8fafc' : '#0f172a',
        transition: 'all 0.3s ease',
        zIndex: 1100,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          px: { xs: 1.5, sm: 3, md: 4 },
          py: 0.8,
          minHeight: { xs: 58, sm: 66 },
        }}
      >
        {/* Top-Left: Logo & Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 34, sm: 40 },
              height: { xs: 34, sm: 40 },
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
              color: '#fff',
              boxShadow: `0 4px 12px ${primaryColor}40`,
              flexShrink: 0,
            }}
          >
            <HealthAndSafetyIcon sx={{ fontSize: { xs: 22, sm: 26 } }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                letterSpacing: 0.3,
                lineHeight: 1.15,
                fontSize: { xs: '0.92rem', sm: '1.15rem' },
                background: `linear-gradient(90deg, ${primaryColor}, #0284c7)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap',
              }}
            >
              PRAGATI FOUNDATION
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: { xs: '0.62rem', sm: '0.7rem' },
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  display: { xs: 'none', sm: 'inline-block' },
                  whiteSpace: 'nowrap',
                }}
              >
                Healthcare Camp
              </Typography>
              <Chip
                label={subdomain.toUpperCase()}
                size="small"
                onClick={handleOpenModuleMenu}
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  backgroundColor: `${primaryColor}18`,
                  color: primaryColor,
                  borderRadius: '6px',
                  border: `1px solid ${primaryColor}40`,
                  cursor: 'pointer',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Center: Profile / Rating Toggle Switch (Desktop) */}
        {subdomain === 'profile' && (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={profileTab}
              exclusive
              onChange={(_, val) => val && setProfileTab(val)}
              size="small"
              sx={{
                borderRadius: '10px',
                bgcolor: `${primaryColor}12`,
                border: `1px solid ${primaryColor}30`,
                p: '2px',
                '& .MuiToggleButton-root': {
                  px: 2,
                  py: 0.4,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  border: 'none',
                  borderRadius: '8px !important',
                  color: mode === 'dark' ? '#cbd5e1' : '#334155',
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    bgcolor: primaryColor,
                    color: '#fff',
                    boxShadow: `0 2px 8px ${primaryColor}55`,
                    '&:hover': {
                      bgcolor: primaryColor,
                    },
                  },
                },
              }}
            >
              <ToggleButton value="Profile">
                <AccountCircleIcon sx={{ fontSize: '0.95rem', mr: 0.6 }} />
                Profile
              </ToggleButton>
              <ToggleButton value="Rating">
                <StarIcon
                  sx={{
                    fontSize: '0.95rem',
                    mr: 0.6,
                    color: profileTab === 'Rating' ? '#fff' : '#f59e0b',
                  }}
                />
                Rating
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {/* Top-Right: Responsive Module Selector + Avatar Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          {/* Module Switcher Dropdown (Responsive: fits all screens, never crops Meds) */}
          <Button
            size="small"
            variant="outlined"
            onClick={handleOpenModuleMenu}
            startIcon={currentModule.icon}
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              py: 0.45,
              px: 1.4,
              borderColor: `${primaryColor}44`,
              color: 'text.primary',
              bgcolor: `${primaryColor}08`,
              '&:hover': {
                borderColor: primaryColor,
                bgcolor: `${primaryColor}14`,
              },
            }}
          >
            {currentModule.label} Counter
          </Button>

          {/* Module Selector Menu */}
          <Menu
            anchorEl={moduleMenuAnchor}
            open={openModuleMenu}
            onClose={handleCloseModuleMenu}
            PaperProps={{
              sx: {
                borderRadius: '12px',
                mt: 1,
                minWidth: 200,
                background: liquidGlass.glassBg,
                backdropFilter: liquidGlass.backdropBlur,
                border: liquidGlass.glassBorder,
                boxShadow: liquidGlass.glassShadow,
                p: 0.5,
              },
            }}
          >
            <Box sx={{ px: 1.5, py: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                SWITCH COUNTER STATION
              </Typography>
            </Box>
            <Divider sx={{ my: 0.5, borderColor: `${primaryColor}22` }} />
            {MODULES.map((mod) => (
              <MenuItem
                key={mod.id}
                selected={subdomain === mod.id}
                onClick={() => {
                  setSubdomain(mod.id);
                  handleCloseModuleMenu();
                }}
                sx={{
                  borderRadius: '8px',
                  py: 0.8,
                  px: 1.5,
                  fontSize: '0.85rem',
                  fontWeight: subdomain === mod.id ? 800 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  color: subdomain === mod.id ? primaryColor : 'text.primary',
                }}
              >
                {mod.icon}
                {mod.label} Counter
              </MenuItem>
            ))}
          </Menu>

          {/* Profile Icon with hover menu */}
          <Tooltip title="Volunteer Profile & Settings" arrow>
            <IconButton
              onClick={handleOpenProfileMenu}
              sx={{
                p: 0.4,
                border: `2px solid ${primaryColor}55`,
                borderRadius: '50%',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.06)',
                },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: primaryColor,
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  boxShadow: `0 2px 8px ${primaryColor}40`,
                }}
              >
                {volunteerInitials}
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* Profile Dropdown Menu */}
          <Menu
            anchorEl={profileMenuAnchor}
            open={openProfileMenu}
            onClose={handleCloseProfileMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 260,
                borderRadius: '12px',
                background: liquidGlass.glassBg,
                backdropFilter: liquidGlass.backdropBlur,
                WebkitBackdropFilter: liquidGlass.backdropBlur,
                border: liquidGlass.glassBorder,
                boxShadow: liquidGlass.glassShadow,
                p: 1,
              },
            }}
          >
            {/* 1. Greeting Volunteer */}
            <Box sx={{ px: 2, py: 1.2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryColor }}>
                Hello, {volunteer?.name || 'Camp Volunteer'} 👋
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Mobile: {volunteer?.mobile || 'Not Registered'}
              </Typography>
              <Chip
                label={volunteer?.role || 'VOLUNTEER'}
                size="small"
                icon={<BadgeIcon sx={{ fontSize: '0.8rem !important' }} />}
                sx={{
                  mt: 0.8,
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  bgcolor: `${primaryColor}15`,
                  color: primaryColor,
                }}
              />
            </Box>

            <Divider sx={{ my: 1, borderColor: `${primaryColor}22` }} />

            {/* 2. Patient Count */}
            <Box
              sx={{
                px: 2,
                py: 1,
                borderRadius: '10px',
                bgcolor: `${primaryColor}10`,
                mx: 1,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Processed Today
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: primaryColor }}>
                  Patient Count
                </Typography>
              </Box>
              <Chip
                label={patientCount}
                color="primary"
                size="small"
                sx={{ fontWeight: 800, fontSize: '0.85rem', px: 0.5, borderRadius: '6px' }}
              />
            </Box>

            <Divider sx={{ my: 1, borderColor: `${primaryColor}22` }} />

            {/* Subdomain Switcher (Mobile & Small screens) */}
            <Box sx={{ px: 2, py: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                SWITCH COUNTER STATION
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 1,
                  mt: 1,
                }}
              >
                {MODULES.map((mod) => (
                  <Button
                    key={mod.id}
                    fullWidth
                    size="small"
                    variant={subdomain === mod.id ? 'contained' : 'outlined'}
                    onClick={() => {
                      setSubdomain(mod.id);
                      handleCloseProfileMenu();
                    }}
                    startIcon={mod.icon}
                    sx={{
                      fontSize: '0.72rem',
                      py: 0.6,
                      borderRadius: '8px',
                      textTransform: 'capitalize',
                      borderColor: `${primaryColor}44`,
                    }}
                  >
                    {mod.label}
                  </Button>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 1, borderColor: `${primaryColor}22` }} />

            {/* Theme Toggle (Dark / Light) */}
            <MenuItem onClick={toggleMode} sx={{ borderRadius: '8px', py: 1 }}>
              {mode === 'dark' ? (
                <Brightness7Icon sx={{ mr: 1.5, color: '#f59e0b', fontSize: 20 }} />
              ) : (
                <Brightness4Icon sx={{ mr: 1.5, color: '#6366f1', fontSize: 20 }} />
              )}
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </Typography>
            </MenuItem>

            {/* Theme Primary Color Option Toggle (#1556A3 vs #198847) */}
            <MenuItem
              onClick={() => {
                setPrimaryColor(primaryColor === '#1556A3' ? '#198847' : '#1556A3');
              }}
              sx={{ borderRadius: '8px', py: 1 }}
            >
              <PaletteIcon sx={{ mr: 1.5, color: primaryColor, fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {primaryColor === '#1556A3'
                  ? 'Switch Color: Green (#198847)'
                  : 'Switch Color: Blue (#1556A3)'}
              </Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Mobile Sub-Bar: Profile / Rating Toggle Switch (Keeps mobile toolbar clean and formal) */}
      {subdomain === 'profile' && (
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'center',
            py: 0.8,
            px: 2,
            borderTop: liquidGlass.glassBorder,
            bgcolor: liquidGlass.glassBg,
          }}
        >
          <ToggleButtonGroup
            value={profileTab}
            exclusive
            onChange={(_, val) => val && setProfileTab(val)}
            size="small"
            fullWidth
            sx={{
              maxWidth: 320,
              borderRadius: '10px',
              bgcolor: `${primaryColor}12`,
              border: `1px solid ${primaryColor}30`,
              p: '2px',
              '& .MuiToggleButton-root': {
                py: 0.4,
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'none',
                border: 'none',
                borderRadius: '8px !important',
                color: mode === 'dark' ? '#cbd5e1' : '#334155',
                '&.Mui-selected': {
                  bgcolor: primaryColor,
                  color: '#fff',
                  boxShadow: `0 2px 8px ${primaryColor}55`,
                  '&:hover': {
                    bgcolor: primaryColor,
                  },
                },
              },
            }}
          >
            <ToggleButton value="Profile">
              <AccountCircleIcon sx={{ fontSize: '0.9rem', mr: 0.6 }} />
              Profile
            </ToggleButton>
            <ToggleButton value="Rating">
              <StarIcon
                sx={{
                  fontSize: '0.9rem',
                  mr: 0.6,
                  color: profileTab === 'Rating' ? '#fff' : '#f59e0b',
                }}
              />
              Rating
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
    </AppBar>
  );
};
