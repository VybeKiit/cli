import rawStates from './componentStates.json' with { type: 'json' };

/**
 * Canonical component state ids shared by primitive stories and page recipes (ADR-0041).
 * The data lives in `componentStates.json` so the node gates can read the same source.
 */
export type ComponentStateId =
  | 'default'
  | 'disabled'
  | 'loading'
  | 'error'
  | 'success'
  | 'empty'
  | 'readonly'
  | 'selected';

/** Visual tone a state chip renders with. */
export type ComponentStateTone = 'neutral' | 'muted' | 'info' | 'destructive' | 'success';

/** One canonical state, with the copy and tone the gallery renders. */
export interface ComponentStateMeta {
  readonly id: ComponentStateId;
  readonly label: string;
  readonly description: string;
  readonly tone: ComponentStateTone;
  /** Whether a page recipe may advertise this state via `statesCovered` (page-level states). */
  readonly recipeLevel: boolean;
}

/** The canonical taxonomy, in display order. */
export const COMPONENT_STATES = rawStates as readonly ComponentStateMeta[];

/** Every canonical state id. */
export const COMPONENT_STATE_IDS: readonly ComponentStateId[] = COMPONENT_STATES.map(
  (state) => state.id,
);

/** The subset a page recipe may advertise (loading / error / success / empty). */
export const RECIPE_STATE_IDS: readonly ComponentStateId[] = COMPONENT_STATES.filter(
  (state) => state.recipeLevel,
).map((state) => state.id);

const STATE_BY_ID = Object.fromEntries(
  COMPONENT_STATES.map((state) => [state.id, state]),
) as Readonly<Record<ComponentStateId, ComponentStateMeta>>;

/**
 * Look up the metadata for a canonical state id.
 *
 * @param id - A canonical component state id.
 * @returns The state's label, description, and tone.
 * @example
 * componentStateMeta('loading').label; // "Loading"
 */
export const componentStateMeta = (id: ComponentStateId): ComponentStateMeta => STATE_BY_ID[id];

/**
 * Narrow an arbitrary string to a canonical state id.
 *
 * @param value - Any string, e.g. a manifest entry.
 * @returns True when the string is a known canonical state id.
 * @example
 * isComponentStateId('empty'); // true
 */
export const isComponentStateId = (value: string): value is ComponentStateId =>
  Object.hasOwn(STATE_BY_ID, value);
