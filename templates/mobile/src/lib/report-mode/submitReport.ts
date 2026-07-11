import {
  buildAssistantDeepLink,
  formatReportPrompt,
  resolveVybeAssistant,
  type ReportPayload,
} from '@vybekiit/report-mode';
import { readNodeEnv } from '@/lib/nodeEnv';
import { canOpenURL, openURL } from 'expo-linking';
import { Share } from 'react-native';

/**
 * Resolve the preferred assistant target from mobile runtime env.
 *
 * @returns The configured assistant target, or null when none is configured.
 * @example
 * const assistant = mobileVybeAssistant();
 */
const getAssistant = () => resolveVybeAssistant(readNodeEnv());

/**
 * Submit a mobile report through a deep link when available, otherwise Share sheet.
 *
 * @param payload - Report details collected from the mobile report overlay.
 * @returns A promise that resolves after the handoff opens.
 * @example
 * await submitMobileReport({ route: '/', selector: 'tap@1,2', builderNote: 'Wrong copy' });
 */
export const submitMobileReport = async (payload: ReportPayload): Promise<void> => {
  const prompt = formatReportPrompt({ ...payload, platform: 'mobile' });
  const assistant = getAssistant();

  if (assistant) {
    const url = buildAssistantDeepLink(assistant, '', prompt);
    if (url !== null) {
      const canOpen = await canOpenURL(url);
      if (canOpen) {
        await openURL(url);
        return;
      }
    }
  }

  await Share.share({ message: prompt });
};

export { getAssistant as mobileVybeAssistant };
