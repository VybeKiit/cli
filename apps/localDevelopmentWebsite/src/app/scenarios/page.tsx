import { ScenariosRunner } from '@/components/ScenariosRunner';

/**
 * Click-through index of every openable vibe journey.
 * Runs fixture demos in place (no chat / agent required).
 *
 * @returns Scenario runner page.
 * @example
 * open http://localhost:3005/scenarios
 */
const ScenariosPage = () => <ScenariosRunner />;

export default ScenariosPage;
