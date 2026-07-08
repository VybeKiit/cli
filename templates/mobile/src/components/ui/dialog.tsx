import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme/useTheme';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export interface DialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description?: string;
  readonly children?: ReactNode;
}

/**
 * Modal dialog for confirmations and short forms.
 *
 * @param props - Dialog visibility, copy, close callback, and optional body.
 * @returns A themed modal dialog.
 * @example
 * <Dialog open={open} onOpenChange={setOpen} title="Confirm" />
 */
export const Dialog = ({
  open,
  onOpenChange,
  title = '',
  description = '',
  children = null,
}: DialogProps) => {
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
          {description.length > 0 ? (
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
};

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
