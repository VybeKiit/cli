#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const repoRoot = repoRootFrom(import.meta.url);
const indexPath = resolve(repoRoot, 'apps/componentLibrary/src/data/designSystem.ts');
const statesPath = resolve(repoRoot, 'apps/componentLibrary/src/lib/componentStates.json');
const storiesDirectory = resolve(repoRoot, 'apps/componentLibrary/src/stories/vybekiit');

/** Parse the generated primitive array without executing application TypeScript. */
export const parsePrimitiveDescriptors = (indexSource) => {
  const declaration = 'export const DESIGN_SYSTEM_PRIMITIVES = ';
  const start = indexSource.indexOf(declaration);
  const end = indexSource.indexOf('\n] as const satisfies', start);
  if (start < 0 || end < 0) {
    throw new Error('design-system index has no generated primitive array');
  }
  const json = indexSource.slice(start + declaration.length, end + 2);
  return JSON.parse(json);
};

/** Return contract violations for generated descriptors and their required live overrides. */
export const findComponentStoryViolations = ({ primitives, stateIds, readStory }) => {
  const violations = [];
  const names = new Set();
  const slugs = new Set();

  for (const primitive of primitives) {
    if (names.has(primitive.name)) {
      violations.push(`duplicate primitive name: ${primitive.name}`);
    }
    if (slugs.has(primitive.slug)) {
      violations.push(`duplicate primitive slug: ${primitive.slug}`);
    }
    names.add(primitive.name);
    slugs.add(primitive.slug);

    for (const state of primitive.states) {
      if (!stateIds.has(state)) {
        violations.push(`${primitive.name}: unknown state ${state}`);
      }
    }

    if (!primitive.hasOverride) {
      continue;
    }
    const storySource = readStory(primitive.name);
    if (storySource === undefined) {
      violations.push(`${primitive.name}: required live override is missing`);
      continue;
    }
    if (!/\bShowAll\s*:/.test(storySource)) {
      violations.push(`${primitive.name}: override does not expose ShowAll`);
    }
  }

  return violations;
};

export const checkComponentStories = () => {
  const indexSource = readFileSync(indexPath, 'utf8');
  const primitives = parsePrimitiveDescriptors(indexSource);
  const states = JSON.parse(readFileSync(statesPath, 'utf8'));
  const stateIds = new Set(states.map((state) => state.id));
  return findComponentStoryViolations({
    primitives,
    stateIds,
    readStory: (name) => {
      try {
        return readFileSync(resolve(storiesDirectory, `${name}.tsx`), 'utf8');
      } catch {
        return undefined;
      }
    },
  });
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const violations = checkComponentStories();
  if (violations.length > 0) {
    console.error(violations.map((violation) => `- ${violation}`).join('\n'));
    process.exit(1);
  }
  console.log('Component story coverage is current.');
}
