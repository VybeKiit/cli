import { MobileSaasScreen } from '@/components/saas-screen';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMobileSaasScreen } from '@/data/saasScreens';
import { useTheme } from '@/theme/useTheme';
import { ScrollView, StyleSheet } from 'react-native';

interface MobileSaasRouteProps {
  readonly screen: string;
}

/** Render a registered mobile SaaS screen route. */
export const MobileSaasRoute = ({ screen }: MobileSaasRouteProps) => {
  const definition = getMobileSaasScreen(screen);
  if (definition === undefined) {
    return <MissingMobileSaasScreen label={screen} />;
  }

  return <MobileSaasScreen screen={definition} />;
};

interface MissingMobileSaasScreenProps {
  readonly label: string;
}

/** Render an explicit route error for unknown mobile SaaS screen keys. */
export const MissingMobileSaasScreen = ({ label }: MissingMobileSaasScreenProps) => {
  const { colors, spacing } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { padding: spacing.lg }]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Screen not found</CardTitle>
          <CardDescription>No mobile SaaS screen exists for "{label}".</CardDescription>
        </CardHeader>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
