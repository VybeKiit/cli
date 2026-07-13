import type { Journey, JourneyToolEvent } from '@vybekiit/assistant-chat';
import { applyToolEvent, seedJourneysFromMessage } from '@vybekiit/assistant-chat';
import { create } from 'zustand';

type JourneyState = {
  readonly journeys: readonly Journey[];
  readonly isSimulating: boolean;
  /**
   * Seed domain journeys from a user message (auth/db/payments/deploy).
   * Replaces the current rail when at least one domain matches.
   */
  readonly seedFromMessage: (message: string) => readonly Journey[];
  readonly applyTool: (event: JourneyToolEvent) => void;
  readonly setJourneys: (journeys: readonly Journey[]) => void;
  readonly setSimulating: (value: boolean) => void;
  readonly clear: () => void;
};

/**
 * In-memory domain journeys for the local-dev assistant rail.
 * Not persisted: rehydrating an empty rail after seed wiped Live work cards on click.
 */
export const useJourneyStore = create<JourneyState>()((set, get) => ({
  journeys: [],
  isSimulating: false,

  seedFromMessage: (message) => {
    const next = seedJourneysFromMessage(message);
    if (next.length > 0) {
      set({ journeys: next });
    }
    return next;
  },

  applyTool: (event) => {
    const current = get().journeys;
    if (current.length === 0) {
      return;
    }
    set({
      journeys: current.map((journey) => applyToolEvent(journey, event)),
    });
  },

  setJourneys: (journeys) => set({ journeys }),
  setSimulating: (value) => set({ isSimulating: value }),
  clear: () => set({ journeys: [], isSimulating: false }),
}));
