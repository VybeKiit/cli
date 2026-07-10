import {
  getPageRecipeInstall,
  PAGE_RECIPE_INSTALLS,
  renderPageRecipeInstallStep,
} from '@vybekiit/agent-kit/catalogs/pageRecipeInstall';
import { describe, expect, it } from 'vitest';

describe('pageRecipeInstall', () => {
  it('maps long-tail goals to recipe sources', () => {
    const ai = getPageRecipeInstall('add-ai');
    expect(ai?.recipeId).toBe('ai-assistant');
    expect(ai?.sourcePath).toContain('AiAssistantPage.tsx');
  });

  it('maps auth and onboarding goals', () => {
    expect(getPageRecipeInstall('sign-in')?.exportName).toBe('AuthPage');
    expect(getPageRecipeInstall('onboarding')?.exportName).toBe('OnboardingPage');
    expect(getPageRecipeInstall('reset-password')?.exportName).toBe('AccountSecurityPage');
    expect(getPageRecipeInstall('buy-domain')?.recipeId).toBe('launch-checklist');
  });

  it('maps orphan commerce and ops catalog ids', () => {
    expect(getPageRecipeInstall('commerce-checkout')?.exportName).toBe('CheckoutPage');
    expect(getPageRecipeInstall('feature-flags')?.exportName).toBe('FeatureFlagsPage');
    expect(getPageRecipeInstall('crm-pipeline')?.targetRoute).toBe('/pipeline');
  });

  it('renders an install step with verify language', () => {
    const step = renderPageRecipeInstallStep('add-search');
    expect(step).toContain('Install the page recipe first');
    expect(step).toContain('SearchPage');
    expect(step).toContain('Verify');
  });

  it('returns empty install step for unmapped goals', () => {
    expect(renderPageRecipeInstallStep('doctor')).toBe('');
  });

  it('keeps unique goal ids', () => {
    const ids = PAGE_RECIPE_INSTALLS.map((entry) => entry.goalId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('points every entry at an existing page recipe file path', () => {
    for (const entry of PAGE_RECIPE_INSTALLS) {
      expect(entry.sourcePath).toMatch(/^apps\/componentLibrary\/src\/pageRecipes\/\w+\.tsx$/);
      expect(entry.exportName.length).toBeGreaterThan(0);
      expect(entry.targetRoute.startsWith('/')).toBe(true);
    }
  });
});
