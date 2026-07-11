import { MONTHS } from './constants';

/** Format a date-only ISO string without timezone drift (stays stable across SSR/CSR). */
export const formatDate = (iso: string): string => {
  const [, month, day] = iso.split('-');
  return `${MONTHS[Number(month) - 1]} ${Number(day)}`;
};

export const initials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
