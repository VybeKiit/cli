import { describe, expect, it } from 'vitest';
import {
  formatChecklistEntry,
  planProductionChecklist,
  renderProductionGates,
} from '../../src/catalogs/production-gates';

describe('production-gates', () => {
  it('returns gates per template', () => {
    expect(planProductionChecklist('web').length).toBeGreaterThan(2);
    expect(planProductionChecklist('backend').some((g) => g.id === 'health')).toBe(true);
  });

  it('formats checklist entry', () => {
    const entry = formatChecklistEntry({
      from: 'local sign-in',
      to: 'real accounts',
      because: 'builder asked for real accounts',
    });
    expect(entry).toContain('local sign-in');
    expect(entry).toContain('real accounts');
  });

  it('renders checkboxes', () => {
    expect(renderProductionGates('web')).toContain('- [ ]');
  });
});
