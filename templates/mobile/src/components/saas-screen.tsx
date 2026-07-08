import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  MobileSaasItem,
  MobileSaasScreen as MobileSaasScreenDefinition,
} from '@/data/saasScreens';
import { useTheme } from '@/theme/useTheme';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export interface MobileSaasScreenProps {
  readonly screen: MobileSaasScreenDefinition;
}

/**
 * Render a buyer-ready mobile SaaS screen.
 *
 * @param props - Screen definition selected from the route registry.
 * @returns A native SaaS screen with metrics, route objects, actions, and checklist items.
 * @example
 * <MobileSaasScreen screen={screen} />
 */
export const MobileSaasScreen = ({ screen }: MobileSaasScreenProps) => {
  const { colors, spacing, fontSizes, fontWeights } = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.xl }]}
    >
      <View style={{ gap: spacing.sm }}>
        <Badge variant="secondary">{screen.eyebrow}</Badge>
        <Text
          style={{
            color: colors.foreground,
            fontSize: fontSizes.xxxl,
            fontWeight: fontWeights.bold,
          }}
        >
          {screen.title}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.base }}>
          {screen.summary}
        </Text>
        <View style={{ gap: spacing.sm }}>
          <Button title={screen.primaryLabel} icon={screen.primaryIcon} size="lg" />
          <Button
            title={screen.secondaryLabel}
            icon={screen.secondaryIcon}
            size="lg"
            variant="outline"
          />
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        {screen.metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle style={{ fontSize: fontSizes.xxxl }}>{metric.value}</CardTitle>
              <CardDescription>{metric.detail}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </View>

      <Card>
        <CardHeader>
          <CardTitle>{screen.title}</CardTitle>
          <CardDescription>Core objects and states this screen ships with.</CardDescription>
        </CardHeader>
        <CardContent>
          <MobileSaasItemList items={screen.items} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Implementation checklist</CardTitle>
          <CardDescription>Visible states ready before customization.</CardDescription>
        </CardHeader>
        <CardContent>
          <MobileSaasItemList items={screen.checklist} />
        </CardContent>
      </Card>
    </ScrollView>
  );
};

interface MobileSaasItemListProps {
  readonly items: readonly MobileSaasItem[];
}

/**
 * Render the item rows used by mobile SaaS screens.
 *
 * @param props - Items to render.
 * @returns Native rows with title, description, and metadata.
 * @example
 * <MobileSaasItemList items={screen.items} />
 */
const MobileSaasItemList = ({ items }: MobileSaasItemListProps) => {
  const { colors, spacing, fontSizes, fontWeights, radius } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((item) => (
        <View
          key={item.title}
          style={[
            styles.item,
            {
              borderColor: colors.border,
              borderRadius: radius,
              padding: spacing.md,
            },
          ]}
        >
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: fontSizes.base,
                fontWeight: fontWeights.semibold,
              }}
            >
              {item.title}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
              {item.description}
            </Text>
          </View>
          <Text style={{ color: colors.primary, fontSize: fontSizes.xs }}>{item.meta}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  item: {
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
  },
});
