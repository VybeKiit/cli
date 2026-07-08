import type { Plugin as EsbuildPlugin } from 'esbuild';
import type { Plugin as VitePlugin } from 'vite';

/** esbuild plugin so tsup can bundle `@vybekiit/*` self-imports during build. */
export function createWorkspaceAliasPlugin(): EsbuildPlugin;

/** Vite/Vitest plugin — same `@vybekiit/*` resolution for tests. */
export function createViteWorkspaceAliasPlugin(): VitePlugin;
