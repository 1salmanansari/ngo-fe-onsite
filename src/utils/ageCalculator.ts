import dayjs, { Dayjs } from 'dayjs';

/**
 * Calculates patient age based on Date of Birth.
 * Validates that date is not in future and within 120 years past.
 */
export function calculateAgeFromDob(dob: Dayjs | Date | number | null | undefined): {
  age: number | null;
  error: string | null;
} {
  if (!dob) {
    return { age: null, error: null };
  }

  const d = dayjs(dob);
  if (!d.isValid()) {
    return { age: null, error: 'Invalid Date of Birth' };
  }

  const now = dayjs();
  if (d.isAfter(now)) {
    return { age: null, error: 'Date of birth cannot be in the future' };
  }

  const minAllowedDate = now.subtract(120, 'year');
  if (d.isBefore(minAllowedDate)) {
    return { age: null, error: 'Date of birth cannot be older than 120 years' };
  }

  let age = now.year() - d.year();
  const m = now.month() - d.month();
  if (m < 0 || (m === 0 && now.date() < d.date())) {
    age--;
  }

  return { age: Math.max(0, age), error: null };
}
