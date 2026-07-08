'use client';

import { createElement } from 'react';

import type { ClaudeOctopusPose } from '@/components/builder-assistant-mark/claudeOctopusPoses';

/**
 * Load vybe kiit demo from browser storage or catalog data.
 *
 * @param name - Catalog component name.
 * @returns The loaded value produced by loadVybeKiitDemo.
 * @example
 * const result = await loadVybeKiitDemo('button');
 */
export const loadVybeKiitDemo = async (name: string): Promise<Record<string, unknown>> => {
  if (name.startsWith('claude-octopus-scene-')) {
    const scene = name.slice('claude-octopus-scene-'.length);
    const { MascotSceneDemo } = await import('@library/demos/vybekiit/_mascotSceneDemo');
    return {
      default() {
        return createElement(MascotSceneDemo, { scene });
      },
    };
  }

  if (
    name.startsWith('claude-octopus-') &&
    name !== 'claude-octopus-showcase' &&
    name !== 'claude-octopus-macos-desk'
  ) {
    const pose = name.slice('claude-octopus-'.length) as ClaudeOctopusPose;
    const { MascotPoseDemo } = await import('@library/demos/vybekiit/_mascotPoseDemo');
    return {
      default() {
        return createElement(MascotPoseDemo, { pose });
      },
    };
  }

  return import(`@library/demos/vybekiit/${name}`);
};
