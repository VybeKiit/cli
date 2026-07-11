import { describe, expect, it } from 'vitest';
import { searchDoctorTools } from './doctorTools.js';

describe('searchDoctorTools', () => {
  it('finds database tools', () => {
    const page = searchDoctorTools('database');
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.some((item) => item.category === 'data')).toBe(true);
  });
});
