import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DASHBOARD_STATS, GETTING_STARTED } from '@/data/dashboard';
import { useTheme } from '@/theme/use-theme';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Minimal signed-in dashboard — the RN parallel of the web dashboard page. The
 * route guard and real data are marked stubs the agent wires next.
 *
 * TODO(vybekiit): protect this route — redirect to /login when there is no session — skill: add-signin
 * TODO(vybekiit): replace the placeholder stats with the builder's real data — skill: save-data
 */
export default function DashboardScreen() {
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.xl }]}
    >
      <View style={{ gap: spacing.xs }}>
        <Text
          style={{
            color: colors.foreground,
            fontSize: fontSizes.xxl,
            fontWeight: fontWeights.bold,
          }}
        >
          Dashboard
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.base }}>
          Welcome back.
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        {DASHBOARD_STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle style={{ fontSize: fontSizes.xxxl }}>{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </View>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>A few things you can ask your AI agent to do next.</CardDescription>
        </CardHeader>
        <CardContent>
          <View style={{ gap: spacing.sm }}>
            {GETTING_STARTED.map((step) => (
              <Text key={step} style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
                {step}
              </Text>
            ))}
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
