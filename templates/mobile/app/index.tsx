import { Button } from '@/components/ui/button';
import { FEATURES } from '@/data/marketing';
import { useTheme } from '@/theme/use-theme';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Home / marketing screen — the RN parallel of the web `page.tsx`. A starting point
 * the agent reshapes to the builder's idea: hero copy, a CTA to sign up / view
 * pricing, and the {@link FEATURES} highlights. Navigates with expo-router's
 * `router.push` (the native equivalent of web's `<Link>`).
 */
export default function HomeScreen() {
  const router = useRouter();
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.xl }]}
    >
      <View style={{ gap: spacing.md }}>
        <Text
          style={{
            color: colors.foreground,
            fontSize: fontSizes.xxxl,
            fontWeight: fontWeights.bold,
          }}
        >
          Your app starts here.
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.lg }}>
          Tell your AI agent what you want to build. It wires the payments, the database, and the
          deploy — you just describe the idea.
        </Text>
        <View style={{ gap: spacing.sm }}>
          <Button title="Get started" size="lg" onPress={() => router.push('/signup')} />
          <Button
            title="See pricing"
            size="lg"
            variant="outline"
            onPress={() => router.push('/pricing')}
          />
        </View>
      </View>

      <View style={{ gap: spacing.lg }}>
        {FEATURES.map((feature) => (
          <View key={feature.title} style={{ gap: spacing.xs }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: fontSizes.base,
                fontWeight: fontWeights.semibold,
              }}
            >
              {feature.title}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
              {feature.body}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
