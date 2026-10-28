export interface Department {
  id: string;
  name: string;
  created?: number;
  updated?: number;
}

export interface IVitals {
  bp?: string;
  pulse?: number | '';
  tempreture?: number | '';
  spo2?: number | '';
  weight?: number | '';
  height?: number | '';
}

export interface Patient {
  id: string;
  patientId: number;
  name: string;
  age: number;
  dob?: number;
  mobile: number | string;
  gender: 'MALE' | 'FEMALE' | 'OTHERS';
  address?: string;
  complaint: string;
  department: string;
  doctorId?: number;
  author: string;
  vitals?: IVitals;
  hasTest?: boolean;
  hasMeds?: boolean;
  hasReferral?: boolean;
  ratings?: number;
  created?: number;
  updated?: number;
}

export interface Volunteer {
  id?: string;
  name: string;
  mobile: string;
  role: string;
  username?: string;
  token?: string;
}

export type ToastState = 'SUCCESS' | 'ERROR' | 'ALERT';

export interface ToastNotificationItem {
  id: string;
  message: string;
  state: ToastState;
}

export type SubdomainType = 'register' | 'vitals' | 'profile' | 'referral' | 'tests' | 'meds';

export interface Doctor {
  id: string;
  doctorId: number;
  firstName: string;
  lastName: string;
  department: string;
  degree: string;
  hospital?: string;
}

export interface DiagnosisTest {
  id: string;
  name: string;
  created?: number;
  updated?: number;
}

export interface PharmacyMed {
  id: string;
  name: string;
  qty: number;
  created?: number;
  updated?: number;
}

export interface PrescribeMedItem {
  id: string;
  name?: string;
  qty: number;
}

export type PrimaryColorChoice = '#1556A3' | '#198847';
export type ThemeMode = 'light' | 'dark';
