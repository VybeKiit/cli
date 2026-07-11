import { buildAutomationRegistry } from '@vybekiit/browser-automation/cli/buildRegistry';
import { getAutomation, listAutomationCatalog } from '@vybekiit/browser-automation/cli/catalog';
import { describe, expect, it } from 'vitest';

describe('automation catalog', () => {
  it('lists ls setup and extension verbs', () => {
    const catalog = listAutomationCatalog(buildAutomationRegistry());
    expect(
      catalog.some((entry) => entry.id === 'ls:setup' || entry.id === 'payments/ls:setup'),
    ).toBe(true);
    expect(
      catalog.some((entry) => entry.domain === 'extension' && entry.command === 'upload-package'),
    ).toBe(true);
    expect(catalog.every((entry) => entry.usage.includes('vybekiit-automate'))).toBe(true);
  });

  it('resolves aliases like nc and ls', () => {
    expect(getAutomation('ls', 'standby')?.command).toBe('standby');
    expect(getAutomation('nc', 'setup')?.domain).toMatch(/namecheap|nc/);
    expect(getAutomation('payments/ls:setup')?.command).toBe('setup');
  });
});
