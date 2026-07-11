import { describe, expect, it } from 'vitest';
import {
  findExportedComponents,
  findMultiComponentFiles,
  isReExportBarrel,
} from './checkSingleComponentPerFile.mjs';

describe('isReExportBarrel', () => {
  it('accepts pure re-export barrels', () => {
    expect(
      isReExportBarrel(`export { CustomerDetailPage } from './CustomerDetailPage';
export { InfoRow } from './InfoRow';
`),
    ).toBe(true);
  });

  it('rejects a file with a local component body', () => {
    expect(
      isReExportBarrel(`export const InfoRow = () => <div />;
`),
    ).toBe(false);
  });
});

describe('findExportedComponents', () => {
  it('finds multiple PascalCase const components', () => {
    const source = `
export const InfoRow = () => null;
export const CustomerDetailPage = () => null;
export const useThing = () => null;
`;
    expect(findExportedComponents(source)).toEqual(['InfoRow', 'CustomerDetailPage']);
  });

  it('finds forwardRef components', () => {
    const source = `export const Button = React.forwardRef((props, ref) => null);
`;
    expect(findExportedComponents(source)).toEqual(['Button']);
  });

  it('finds function components', () => {
    const source = `export function PricingPage() { return null; }
`;
    expect(findExportedComponents(source)).toEqual(['PricingPage']);
  });
});

describe('findMultiComponentFiles', () => {
  it('reports zero violations on the live pageRecipes tree', () => {
    const violations = findMultiComponentFiles();
    expect(violations).toEqual([]);
  });
});
