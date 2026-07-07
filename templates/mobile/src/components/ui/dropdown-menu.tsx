import { useTheme } from '@/theme/useTheme';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface DropdownItem {
  readonly label: string;
  readonly onPress: () => void;
}

export interface DropdownMenuProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly triggerLabel?: string;
  readonly items?: readonly DropdownItem[];
}

/**
 * Compact action menu for account actions.
 *
 * @param props - Menu state, trigger label, and action items.
 * @returns A themed modal menu.
 * @example
 * <DropdownMenu open={open} onOpenChange={setOpen} triggerLabel="Menu" items={items} />
 */
export const DropdownMenu = ({
  open,
  onOpenChange,
  triggerLabel = '',
  items = [],
}: DropdownMenuProps) => {
  const { colors, radius, spacing, fontSizes } = useTheme();
  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => onOpenChange(true)}>
        <Text style={{ color: colors.primary, fontSize: fontSizes.sm }}>{triggerLabel}</Text>
      </Pressable>
      <Modal
        visible={open}
        transparent={true}
        animationType="fade"
        onRequestClose={() => onOpenChange(false)}
      >
        <Pressable style={styles.overlay} onPress={() => onOpenChange(false)}>
          <View
            style={[
              styles.menu,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius,
              },
            ]}
          >
            {items.map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="menuitem"
                onPress={() => {
                  onOpenChange(false);
                  item.onPress();
                }}
                style={{ padding: spacing.md }}
              >
                <Text style={{ color: colors.foreground, fontSize: fontSizes.sm }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingHorizontal: 16,
  },
  menu: {
    minWidth: 160,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
