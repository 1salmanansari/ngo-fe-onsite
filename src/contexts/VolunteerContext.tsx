'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Volunteer } from '../types';

interface VolunteerContextType {
  volunteer: Volunteer | null;
  patientCount: number;
  isWelcomeModalOpen: boolean;
  setVolunteerData: (vol: Volunteer) => void;
  incrementPatientCount: () => void;
  resetPatientCount: () => void;
}

const VolunteerContext = createContext<VolunteerContextType | undefined>(undefined);

const STORAGE_KEY_VOLUNTEER = 'pragati_volunteer_info';
const STORAGE_KEY_PATIENT_COUNT = 'pragati_patient_count';

export const VolunteerContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [patientCount, setPatientCount] = useState<number>(0);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      // Check for self-enrollment URL parameter (?self=true, ?enroll=self, or ?author=self_patient)
      const searchParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const isSelfEnroll =
        searchParams &&
        (searchParams.get('self') === 'true' ||
          searchParams.get('enroll') === 'self' ||
          searchParams.get('author') === 'self_patient');

      if (isSelfEnroll) {
        const selfVol: Volunteer = {
          id: 'self_patient',
          name: 'Self Registration',
          mobile: '',
          role: 'PATIENT',
          username: 'self_patient',
        };
        setVolunteer(selfVol);
        setIsWelcomeModalOpen(false);
      } else {
        const storedVol = localStorage.getItem(STORAGE_KEY_VOLUNTEER);
        if (storedVol) {
          const parsed = JSON.parse(storedVol);
          setVolunteer(parsed);
          setIsWelcomeModalOpen(false);
        } else {
          setIsWelcomeModalOpen(true);
        }
      }

      const storedCount = localStorage.getItem(STORAGE_KEY_PATIENT_COUNT);
      if (storedCount) {
        setPatientCount(parseInt(storedCount, 10) || 0);
      }
    } catch {
      setIsWelcomeModalOpen(true);
    }
    setInitialized(true);
  }, []);

  const setVolunteerData = useCallback((vol: Volunteer) => {
    setVolunteer(vol);
    localStorage.setItem(STORAGE_KEY_VOLUNTEER, JSON.stringify(vol));
    setIsWelcomeModalOpen(false);
  }, []);

  const incrementPatientCount = useCallback(() => {
    setPatientCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(STORAGE_KEY_PATIENT_COUNT, next.toString());
      return next;
    });
  }, []);

  const resetPatientCount = useCallback(() => {
    setPatientCount(0);
    localStorage.setItem(STORAGE_KEY_PATIENT_COUNT, '0');
  }, []);

  if (!initialized) {
    return null;
  }

  return (
    <VolunteerContext.Provider
      value={{
        volunteer,
        patientCount,
        isWelcomeModalOpen,
        setVolunteerData,
        incrementPatientCount,
        resetPatientCount,
      }}
    >
      {children}
    </VolunteerContext.Provider>
  );
};

export const useVolunteer = (): VolunteerContextType => {
  const context = useContext(VolunteerContext);
  if (!context) {
    throw new Error('useVolunteer must be used within VolunteerContextProvider');
  }
  return context;
};
