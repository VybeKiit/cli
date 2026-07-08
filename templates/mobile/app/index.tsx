import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HOME_FEATURES } from '@/data/marketing';
import { useTranslations } from '@/hooks/useTranslations';
import { useTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Render the mobile home and marketing screen.
 *
 * @returns React Native home screen.
 * @example
 * <HomeScreen />
 */
const HomeScreen = () => {
  const router = useRouter();
  const { t } = useTranslations();
  const { colors, spacing, fontSizes, fontWeights, radius } = useTheme();
  const openSignup = useCallback(() => {
    router.push('/signup');
  }, [router]);
  const openPricing = useCallback(() => {
    router.push('/pricing');
  }, [router]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.xl }]}
    >
      <Card style={{ borderColor: colors.primary, overflow: 'hidden' }}>
        <CardHeader style={{ gap: spacing.md }}>
          <Badge variant="secondary">{t('home.hero.badge')}</Badge>
          <Text
            style={{
              color: colors.foreground,
              fontSize: fontSizes.xxxl,
              fontWeight: fontWeights.bold,
            }}
          >
            {t('home.hero.title')}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.lg }}>
            {t('home.hero.description')}
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Button title={t('home.hero.cta.getStarted')} size="lg" onPress={openSignup} />
            <Button
              title={t('home.hero.cta.seePricing')}
              size="lg"
              variant="outline"
              onPress={openPricing}
            />
          </View>
        </CardHeader>
      </Card>

      <View style={{ gap: spacing.md }}>
        {HOME_FEATURES.map((feature) => (
          <Card key={feature.titleKey} style={{ borderRadius: radius }}>
            <CardHeader>
              <CardTitle style={{ fontSize: fontSizes.base }}>{t(feature.titleKey)}</CardTitle>
              <CardDescription>{t(feature.bodyKey)}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});

export default HomeScreen;
