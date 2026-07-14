export const CREATE_SURFACES = [
  {
    id: 'web',
    label: 'Web app',
    hint: 'Next.js + dashboard + marketing',
    help: 'Next.js + agent layer',
  },
  {
    id: 'mobile',
    label: 'Mobile app',
    hint: 'Expo',
    help: 'Expo + agent layer',
  },
  {
    id: 'extension',
    label: 'Browser extension',
    hint: 'WXT',
    help: 'WXT + agent layer',
  },
  {
    id: 'backend',
    label: 'Backend API',
    hint: 'Express + typed routes',
    help: 'Express API + typed routes',
  },
] as const satisfies readonly {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly help: string;
}[];

export type CreateSurface = (typeof CREATE_SURFACES)[number]['id'];

export const CREATE_SURFACE_PROMPT_OPTIONS = CREATE_SURFACES.map((surface) => ({
  value: surface.id,
  label: surface.label,
  hint: surface.hint,
}));

export const CREATE_SURFACE_PIPE_FLAGS = CREATE_SURFACES.map((surface) => `--${surface.id}`).join(
  '|',
);

export const CREATE_SURFACE_LIST_FLAGS = CREATE_SURFACES.map((surface, index) => {
  const flag = `--${surface.id}`;
  if (index === CREATE_SURFACES.length - 1) {
    return `or ${flag}`;
  }
  return flag;
}).join(', ');

export const isCreateSurface = (value: string): value is CreateSurface =>
  CREATE_SURFACES.some((surface) => surface.id === value);
