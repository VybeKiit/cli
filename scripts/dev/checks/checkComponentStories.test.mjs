import { describe, expect, it } from 'vitest';
import {
  checkComponentStories,
  findComponentStoryViolations,
  parsePrimitiveDescriptors,
} from './checkComponentStories.mjs';

const primitive = {
  name: 'dialog',
  slug: 'dialog',
  states: ['default'],
  hasOverride: true,
};

describe('parsePrimitiveDescriptors', () => {
  it('reads the generated JSON array', () => {
    const arrayWithoutClosingBracket = JSON.stringify([primitive]).slice(0, -1);
    const source = `export const DESIGN_SYSTEM_PRIMITIVES = ${arrayWithoutClosingBracket}
] as const satisfies readonly PrimitiveDescriptor[];`;
    expect(parsePrimitiveDescriptors(source)).toEqual([primitive]);
  });
});

describe('findComponentStoryViolations', () => {
  it('reports missing overrides and unknown states', () => {
    const violations = findComponentStoryViolations({
      primitives: [{ ...primitive, states: ['invented'] }],
      stateIds: new Set(['default']),
      readStory: () => undefined,
    });
    expect(violations).toEqual([
      'dialog: unknown state invented',
      'dialog: required live override is missing',
    ]);
  });

  it('accepts an override with a ShowAll render', () => {
    const violations = findComponentStoryViolations({
      primitives: [primitive],
      stateIds: new Set(['default']),
      readStory: () => 'export const story = { ShowAll: () => null };',
    });
    expect(violations).toEqual([]);
  });
});

describe('live component stories', () => {
  it('satisfies the generated story contract', () => {
    expect(checkComponentStories()).toEqual([]);
  });
});
