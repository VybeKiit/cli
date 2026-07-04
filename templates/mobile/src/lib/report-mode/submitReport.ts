import {
  buildAssistantDeepLink,
  formatReportPrompt,
  resolveVybeAssistant,
  type ReportPayload,
} from '@vybekiit/report-mode';
import { readNodeEnv } from '@/lib/nodeEnv';
import * as Linking from 'expo-linking';
import { Share } from 'react-native';

function getAssistant() {
  return resolveVybeAssistant(readNodeEnv());
}

export async function submitMobileReport(payload: ReportPayload): Promise<void> {
  const prompt = formatReportPrompt({ ...payload, platform: 'mobile' });
  const assistant = getAssistant();

  if (assistant) {
    const url = buildAssistantDeepLink(assistant, '', prompt);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
  }

  await Share.share({ message: prompt });
}

export { getAssistant as mobileVybeAssistant };
