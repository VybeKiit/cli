/**
 * Build a Next.js route stub that renders the installed recipe export.
 *
 * @param exportName - Named export from the recipe component file.
 * @param componentImportPath - Import path alias, e.g. `@/components/pageRecipes/CartPage`.
 * @param targetRoute - Manifest route for documentation.
 * @returns Route module source.
 * @example
 * const page = pageRecipeRouteStub('CartPage', '@/components/pageRecipes/CartPage', '/cart');
 */
export const pageRecipeRouteStub = (
  exportName: string,
  componentImportPath: string,
  targetRoute: string,
): string => `import { ${exportName} } from '${componentImportPath}';

/**
 * Page recipe route for \`${targetRoute}\` (installed by \`vybekiit add page-recipe\`).
 *
 * Wire the TODOs listed in the install report, then customize copy and data.
 *
 * @returns The installed page recipe component.
 */
const Page = () => <${exportName} />;

export default Page;
`;
