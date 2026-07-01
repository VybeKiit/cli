import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_WEB_UI_LIBS,
  renderForbiddenWebUiLibsList,
  renderWebUiSourcesTable,
  WEB_UI_SOURCES,
} from '../../src/catalogs/ui-sources';

describe('ui-sources', () => {
  it('includes core shadcn ecosystem sources', () => {
    const names = WEB_UI_SOURCES.map((s) => s.name);
    expect(names).toContain('shadcn/ui');
    expect(names).toContain('BundUI / Shadcn UI Kit');
    expect(names).toContain('Magic UI');
    expect(names).toContain('Kokonut UI');
    expect(names).toContain('21st.dev');
    expect(names).toContain('Untitled UI React');
    expect(names).toContain('Gluestack UI');
  });

  it('renders a markdown table', () => {
    const table = renderWebUiSourcesTable();
    expect(table).toContain('| Source | Best for |');
    expect(table).toContain('Magic UI');
  });

  it('renders forbidden libs list', () => {
    expect(renderForbiddenWebUiLibsList()).toContain('nativewind');
    expect(FORBIDDEN_WEB_UI_LIBS.length).toBeGreaterThan(3);
  });
});
