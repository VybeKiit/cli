import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme/useTheme';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

/** Modal dialog — mirrors web Dialog for confirmations. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  const { colors, radius, spacing, fontSizes, fontWeights } = useTheme();
  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <Pressable style={styles.overlay} onPress={() => onOpenChange(false)}>
        <Pressable
          style={[
            styles.content,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius,
              padding: spacing.lg,
              gap: spacing.md,
            },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <Text
            style={{
              color: colors.foreground,
              fontSize: fontSizes.lg,
              fontWeight: fontWeights.semibold,
            }}
          >
            {title}
          </Text>
          {description ? (
            <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
              {description}
            </Text>
          ) : null}
          {children}
          <Button title={t('common.close')} variant="outline" onPress={() => onOpenChange(false)} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
