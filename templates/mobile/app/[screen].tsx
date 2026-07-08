import { MissingMobileSaasScreen, MobileSaasRoute } from '@/components/mobileSaasRoute';
import { useLocalSearchParams } from 'expo-router';

/**
 * Render one dynamic mobile SaaS screen.
 *
 * @returns The selected SaaS screen, or an explicit missing-screen state.
 * @example
 * <DynamicMobileSaasScreen />
 */
const DynamicMobileSaasScreen = () => {
  const { screen } = useLocalSearchParams();

  if (typeof screen !== 'string') {
    return <MissingMobileSaasScreen label="unknown" />;
  }

  return <MobileSaasRoute screen={screen} />;
};

export default DynamicMobileSaasScreen;
