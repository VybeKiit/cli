import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { DASHBOARD_STATS, GETTING_STARTED_STEP_KEYS } from '@/data/dashboard';
import { useTranslations } from '@/hooks/useTranslations';
import { useUser } from '@/hooks/useUser';
import { useTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Render the signed-in mobile dashboard.
 *
 * @returns React Native dashboard screen.
 * @example
 * <DashboardScreen />
 */
const DashboardScreen = () => {
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const { t } = useTranslations();
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!(loading || user)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.md }]}
      >
        <Skeleton height={32} width="60%" />
        <Skeleton height={20} width="80%" />
        <Skeleton height={120} />
        <Skeleton height={120} />
      </ScrollView>
    );
  }

  if (!user) {
    return null;
  }
  const avatarLabel = user.email === null ? t('common.fallback.user') : user.email;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.xl }]}
    >
      <View style={{ gap: spacing.sm }}>
        <Badge variant="secondary">{t('dashboard.badge')}</Badge>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Avatar label={avatarLabel} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: fontSizes.xxl,
                fontWeight: fontWeights.bold,
              }}
            >
              {t('dashboard.title')}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
              {user.email}
            </Text>
          </View>
        </View>
      </View>

      <Tabs
        defaultValue="overview"
        items={[
          {
            value: 'overview',
            label: t('dashboard.tabs.overview'),
            content: (
              <View style={{ gap: spacing.md }}>
                {DASHBOARD_STATS.map((stat) => (
                  <Card key={stat.labelKey}>
                    <CardHeader>
                      <CardDescription>{t(stat.labelKey)}</CardDescription>
                      <CardTitle style={{ fontSize: fontSizes.xxxl }}>{t(stat.valueKey)}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </View>
            ),
          },
          {
            value: 'next',
            label: t('dashboard.tabs.nextSteps'),
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.gettingStarted.title')}</CardTitle>
                  <CardDescription>{t('dashboard.gettingStarted.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <View style={{ gap: spacing.sm }}>
                    {GETTING_STARTED_STEP_KEYS.map((stepKey) => (
                      <Text
                        key={stepKey}
                        style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}
                      >
                        {t(stepKey)}
                      </Text>
                    ))}
                  </View>
                </CardContent>
              </Card>
            ),
          },
        ]}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});

export default DashboardScreen;
