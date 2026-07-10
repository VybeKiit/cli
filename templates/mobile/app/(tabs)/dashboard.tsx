import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/hooks/useTranslations';
import { useTheme } from '@/theme/useTheme';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type RangeKey = '24h' | '7d' | '30d';

const METRICS: Record<RangeKey, readonly { readonly label: string; readonly value: string }[]> = {
  '24h': [
    { label: 'Revenue', value: '$1.2k' },
    { label: 'Orders', value: '9' },
    { label: 'Signups', value: '14' },
  ],
  '7d': [
    { label: 'Revenue', value: '$9.6k' },
    { label: 'Orders', value: '64' },
    { label: 'Signups', value: '96' },
  ],
  '30d': [
    { label: 'Revenue', value: '$41.8k' },
    { label: 'Orders', value: '216' },
    { label: 'Signups', value: '418' },
  ],
};

/** Practice chart series (relative heights 0–1) for the range selector. */
const CHART: Record<RangeKey, readonly number[]> = {
  '24h': [0.3, 0.45, 0.35, 0.6, 0.55, 0.7, 0.4, 0.65, 0.5, 0.8, 0.75, 0.9],
  '7d': [0.4, 0.55, 0.5, 0.7, 0.65, 0.85, 0.75],
  '30d': [0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.58, 0.7, 0.65, 0.8, 0.78, 0.9],
};

const ACTIONS: readonly {
  readonly title: string;
  readonly detail: string;
  readonly href: '/settings' | '/orders' | '/pricing';
}[] = [
  { title: 'Update settings', detail: 'Profile and alerts', href: '/settings' },
  { title: 'Review orders', detail: 'Fulfillment queue', href: '/orders' },
  { title: 'Open pricing', detail: 'Practice checkout handoff', href: '/pricing' },
];

/**
 * Interactive mobile dashboard home with range metrics, practice chart, and next-action links.
 *
 * @returns React Native dashboard screen.
 * @example
 * <DashboardScreen />
 */
const DashboardScreen = () => {
  const { colors, spacing, fontSizes, radius } = useTheme();
  const { t } = useTranslations();
  const [range, setRange] = useState<RangeKey>('7d');
  const metrics = METRICS[range];
  const bars = CHART[range];

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.md }]}
      style={{ backgroundColor: colors.background, flex: 1 }}
    >
      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: colors.foreground, fontSize: fontSizes.xl, fontWeight: '700' }}>
          {t('dashboard.welcome')}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
          {t('dashboard.subtitle')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {(['24h', '7d', '30d'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => setRange(option)}
            style={{
              backgroundColor: range === option ? colors.primary : colors.muted,
              borderRadius: radius,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <Text
              style={{
                color: range === option ? colors.primaryForeground : colors.mutedForeground,
                fontSize: fontSizes.sm,
                fontWeight: '600',
              }}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {metrics.map((metric) => (
          <Card key={metric.label} style={{ flexGrow: 1, minWidth: '30%' }}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle>{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </View>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.chart.title')}</CardTitle>
          <CardDescription>{t('dashboard.chart.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 4,
              height: 120,
              paddingTop: spacing.sm,
            }}
          >
            {bars.map((height, index) => (
              <View
                // Practice series is static per range; index is stable within the series.
                key={`${range}-${String(index)}`}
                style={{
                  flex: 1,
                  height: Math.max(8, Math.round(height * 112)),
                  backgroundColor: colors.primary,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  opacity: 0.55 + height * 0.45,
                }}
              />
            ))}
          </View>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.actions.title')}</CardTitle>
          <CardDescription>{t('dashboard.actions.description')}</CardDescription>
        </CardHeader>
        <CardContent style={{ gap: spacing.sm }}>
          {ACTIONS.map((action) => (
            <Link href={action.href} key={action.href} asChild={true}>
              <Pressable
                style={{
                  borderColor: colors.border,
                  borderRadius: radius,
                  borderWidth: 1,
                  padding: spacing.md,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>{action.title}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.xs }}>
                  {action.detail}
                </Text>
              </Pressable>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Button
        onPress={() => setRange((current) => (current === '7d' ? '30d' : '7d'))}
        title={t('dashboard.refresh')}
        variant="outline"
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
