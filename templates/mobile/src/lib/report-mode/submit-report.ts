import {
  buildAssistantDeepLink,
  formatReportPrompt,
  resolveVybeAssistant,
  type ReportPayload,
} from '@vybekiit/report-mode';
import * as Linking from 'expo-linking';
import { Share } from 'react-native';
import process from 'node:process';

const assistant = resolveVybeAssistant(process.env as Record<string, string | undefined>);

export async function submitMobileReport(payload: ReportPayload): Promise<void> {
  const prompt = formatReportPrompt({ ...payload, platform: 'mobile' });

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

export { assistant as mobileVybeAssistant };
