import React from 'react';
import { OnsiteClientApp } from './OnsiteClientApp';
import { fetchDepartmentsApi } from '../utils/api';
import { Department } from '../types';

export const revalidate = 60; // Revalidate departments cache every 60s

export default async function Page() {
  // Server-side API pre-fetching as specified:
  // "There will be 1 or 2 API which will be called on server side"
  let initialDepartments: Department[] = [];
  try {
    initialDepartments = await fetchDepartmentsApi();
  } catch (err) {
    console.warn('Failed to pre-fetch departments on server side, will use fallback:', err);
  }

  return <OnsiteClientApp initialDepartments={initialDepartments} />;
}
