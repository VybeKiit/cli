import { resolveAiProvider } from '@vybekiit/ai';

/** Server-only AI runtime wire point — skill: add-ai */
export function getAi() {
  return resolveAiProvider();
}
