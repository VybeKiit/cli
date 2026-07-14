/** One file the installer plans to write. */
export type PlannedInstallFile = {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly kind: 'component' | 'shared' | 'theme-helper' | 'route';
  readonly content: string;
};

/** Result of planning or applying a page-recipe install. */
export type PageRecipeInstallPlan = {
  readonly recipeId: string;
  readonly appRoot: string;
  readonly componentsDir: string;
  readonly targetRoute: string;
  readonly exportName: string;
  readonly files: readonly PlannedInstallFile[];
  readonly linkedPresets: readonly string[];
  readonly goalIds: readonly string[];
  readonly todos: readonly string[];
  readonly installNotes: readonly string[];
  readonly acceptanceChecks: readonly string[];
  readonly nextCommands: readonly string[];
};
