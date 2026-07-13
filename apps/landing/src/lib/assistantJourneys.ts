/**
 * Thin host surface: landing reuses assistant-chat domain journeys.
 * Full shell modes (floating) consume these the same as local-dev.
 */
export {
  applyToolEvent,
  applyToolEvents,
  fixtureBridgeEvents,
  fixtureToolEvents,
  type Journey,
  type JourneyDomain,
  type JourneyToolEvent,
  scrubSecrets,
  seedJourney,
  seedJourneysFromMessage,
} from '@vybekiit/assistant-chat';
