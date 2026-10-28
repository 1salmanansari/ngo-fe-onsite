import {
  Department,
  DiagnosisTest,
  Doctor,
  IVitals,
  Patient,
  PharmacyMed,
  Volunteer,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-client-app': 'pragati-onsite',
};

export async function fetchDoctorsApi(searchQuery?: string): Promise<Doctor[]> {
  try {
    const q = new URLSearchParams({ all: 'true', limit: '100' });
    if (searchQuery) q.append('search', searchQuery.trim());
    const res = await fetch(`${API_BASE_URL}/unauth/doctors?${q.toString()}`, {
      method: 'GET',
      headers: HEADERS,
    });
    const data = await res.json();
    return data.data || [];
  } catch {
    return [
      {
        id: 'doc-1',
        doctorId: 1,
        firstName: 'Dr. Salman',
        lastName: 'Ansari',
        department: 'Cardiology',
        degree: 'M.D., M.S.',
        hospital: 'Pragati Center',
      },
      {
        id: 'doc-2',
        doctorId: 2,
        firstName: 'Dr. Aisha',
        lastName: 'Khan',
        department: 'General OPD',
        degree: 'M.B.B.S.',
        hospital: 'Civil Hospital',
      },
    ];
  }
}

export async function fetchTestsApi(): Promise<DiagnosisTest[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/unauth/tests?all=true`, {
      method: 'GET',
      headers: HEADERS,
    });
    const data = await res.json();
    return data.data || [];
  } catch {
    return [
      { id: 'diag-1', name: 'Complete Blood Count (CBC)' },
      { id: 'diag-2', name: 'LIPID Profile' },
      { id: 'diag-3', name: 'Random Blood Sugar (RBS)' },
      { id: 'diag-4', name: 'ECG / Electrocardiogram' },
      { id: 'diag-5', name: 'Chest X-Ray' },
      { id: 'diag-6', name: 'Liver Function Test (LFT)' },
      { id: 'diag-7', name: 'Kidney Function Test (KFT)' },
      { id: 'diag-8', name: 'Urine Routine & Microscopic' },
    ];
  }
}

export async function searchMedsApi(searchQuery?: string): Promise<PharmacyMed[]> {
  try {
    const query = searchQuery
      ? `?seach=${encodeURIComponent(searchQuery.trim())}&search=${encodeURIComponent(searchQuery.trim())}`
      : '';
    const res = await fetch(`${API_BASE_URL}/unauth/meds${query}`, {
      method: 'GET',
      headers: { ...HEADERS, limit: '10', page: '1' },
    });
    const data = await res.json();
    return data.data || [];
  } catch {
    return [
      { id: 'med-1', name: 'Shelcal 500 (Calcium + Vit D3)', qty: 100 },
      { id: 'med-2', name: 'Paracetamol 650mg', qty: 250 },
      { id: 'med-3', name: 'Amoxicillin 500mg', qty: 120 },
      { id: 'med-4', name: 'Pantoprazole 40mg', qty: 180 },
      { id: 'med-5', name: 'Cetirizine 10mg', qty: 150 },
      { id: 'med-6', name: 'Azithromycin 500mg', qty: 90 },
      { id: 'med-7', name: 'Metformin 500mg', qty: 200 },
      { id: 'med-8', name: 'Amlodipine 5mg', qty: 160 },
      { id: 'med-9', name: 'ORS Sachet Powder', qty: 300 },
    ];
  }
}

export async function createReferralApi(payload: {
  patientId: number;
  doctorId: number;
  description: string;
  destails: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/unauth/referrals`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to create referral');
  }
  return data.data;
}

export async function prescribeTestsApi(payload: {
  data: string[];
  patientId: number;
  doctorId?: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/unauth/tests`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to prescribe tests');
  }
  return data.data;
}

export async function prescribeMedsApi(payload: {
  data: { id: string; qty: number }[];
  patientId: number;
  doctorId?: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/unauth/meds`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to prescribe medications');
  }
  return data.data;
}

export async function ratePatientApi(
  patientId: number | string,
  ratings: number,
  feedback?: string
): Promise<any> {
  // Can be called fire-and-forget
  return fetch(`${API_BASE_URL}/unauth/patients/${patientId}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ ratings, ...(feedback ? { feedback: feedback.trim() } : {}) }),
  });
}

export async function updatePatientDoctorApi(
  patientId: number | string,
  doctorId: number
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/unauth/patients/${patientId}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ doctorId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update patient doctor');
  }
  return data.data;
}

export async function registerVolunteerApi(payload: {
  name: string;
  role: string;
  mobile: string;
  username?: string;
  password?: string;
}): Promise<Volunteer> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to register volunteer');
  }

  return data.data;
}

export async function fetchDepartmentsApi(): Promise<Department[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/unauth/departments?all=true&limit=100`, {
      method: 'GET',
      headers: HEADERS,
      cache: 'no-store',
    });

    if (!res.ok) {
      // Fallback in case of network issue
      return getFallbackDepartments();
    }

    const data = await res.json();
    return data.data || [];
  } catch {
    return getFallbackDepartments();
  }
}

export async function registerPatientApi(payload: Partial<Patient>): Promise<Patient> {
  const res = await fetch(`${API_BASE_URL}/unauth/patients`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to register patient');
  }

  return data.data;
}

export async function searchPatientsApi(searchTerm: string): Promise<Patient[]> {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }

  const res = await fetch(
    `${API_BASE_URL}/unauth/patients?search=${encodeURIComponent(searchTerm.trim())}&name=${encodeURIComponent(searchTerm.trim())}`,
    {
      method: 'GET',
      headers: HEADERS,
    }
  );

  const data = await res.json();
  if (!res.ok || !data.success) {
    return [];
  }

  return data.data || [];
}

export async function getPatientByIdApi(id: string | number): Promise<Patient> {
  const res = await fetch(`${API_BASE_URL}/unauth/patients/${id}`, {
    method: 'GET',
    headers: HEADERS,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Patient not found');
  }

  return data.data;
}

export async function updatePatientVitalsApi(
  id: string | number,
  vitals: IVitals
): Promise<Patient> {
  const res = await fetch(`${API_BASE_URL}/unauth/patients/${id}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ vitals }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update patient vitals');
  }

  return data.data;
}

function getFallbackDepartments(): Department[] {
  return [
    { id: 'general-opd', name: 'General Medicine & OPD' },
    { id: 'cardiology', name: 'Cardiology' },
    { id: 'orthopedics', name: 'Orthopedics' },
    { id: 'pediatrics', name: 'Pediatrics' },
    { id: 'ophthalmology', name: 'Ophthalmology (Eye Care)' },
    { id: 'dermatology', name: 'Dermatology' },
    { id: 'ent', name: 'ENT (Ear, Nose & Throat)' },
    { id: 'dental', name: 'Dental Care' },
    { id: 'gynecology', name: 'Gynecology & Obstetrics' },
  ];
}

export function formatDoctorDisplay(doc: Doctor, departments: Department[] = []): string {
  // Check if department is a UUID string (e.g. 17f37e1f-32b9-47ed-85de-09b5f9ec1411)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    doc.department || ''
  );

  let deptName = '';
  if (isUuid) {
    const matchedDept = departments.find((d) => d.id === doc.department);
    deptName = matchedDept ? matchedDept.name : '';
  } else if (doc.department) {
    deptName = doc.department;
  }

  const degreePart = doc.degree ? ` - ${doc.degree}` : '';
  const deptPart = deptName ? ` (${deptName})` : '';

  return `Dr. ${doc.firstName} ${doc.lastName}${degreePart}${deptPart}`;
}
