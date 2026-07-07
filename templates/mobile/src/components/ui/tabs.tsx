import { useTheme } from '@/theme/useTheme';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface TabItem {
  readonly value: string;
  readonly label: string;
  readonly content: ReactNode;
}

export interface TabsProps {
  readonly defaultValue: string;
  readonly items: readonly TabItem[];
}

/**
 * Tabbed sections for compact mobile content.
 *
 * @param props - Initial tab value and tab items to render.
 * @returns A themed tab list and the active panel content.
 * @example
 * <Tabs defaultValue="overview" items={items} />
 */
export const Tabs = ({ defaultValue, items }: TabsProps) => {
  const [active, setActive] = useState(defaultValue);
  const { colors, radius, spacing, fontSizes, fontWeights } = useTheme();
  const current = items.find((item) => item.value === active);

  return (
    <View style={{ gap: spacing.md }}>
      <View style={[styles.list, { backgroundColor: colors.muted, borderRadius: radius }]}>
        {items.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active === item.value }}
            onPress={() => setActive(item.value)}
            style={[
              styles.trigger,
              {
                backgroundColor: active === item.value ? colors.background : 'transparent',
                borderRadius: radius,
              },
            ]}
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: fontSizes.sm,
                fontWeight: active === item.value ? fontWeights.medium : fontWeights.normal,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View>{current === undefined ? null : current.content}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  trigger: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
});
