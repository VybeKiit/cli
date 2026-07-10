import { submitMobileReport } from '@/lib/report-mode/submitReport';
import { useReportDockMobile } from '@/components/report-mode/useReportDockMobile';
import { DOCK_CORNER_LABELS, DOCK_CORNER_PRESETS, getDockInsetStyle } from '@vybekiit/report-mode';
import { usePathname } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';

declare const __DEV__: boolean;

/**
 * Dev-only report-mode overlay for tap-to-report feedback.
 *
 * @returns The report-mode floating action button and modal in development builds.
 * @example
 * <ReportModeDev />
 */
export const ReportModeDev = () => {
  const pathname = usePathname();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { corner, setCorner } = useReportDockMobile();
  const [active, setActive] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [tapPoint, setTapPoint] = useState<{ x: number; y: number } | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!__DEV__) {
    return null;
  }

  const fabInset = getDockInsetStyle(corner, 24);

  const handleScreenTap = (event: GestureResponderEvent): void => {
    if (!active || tapPoint) {
      return;
    }
    const { locationX, locationY } = event.nativeEvent;
    setTapPoint({ x: Math.round(locationX), y: Math.round(locationY) });
  };

  const handleSubmit = async (): Promise<void> => {
    if (!(tapPoint && note.trim())) {
      return;
    }
    setSubmitting(true);
    try {
      await submitMobileReport({
        route: pathname,
        selector: `tap@${tapPoint.x},${tapPoint.y}`,
        builderNote: note.trim(),
        consoleErrors: [],
      });
      setTapPoint(null);
      setNote('');
      setActive(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {active && !tapPoint ? (
        <Pressable style={styles.overlay} onPress={handleScreenTap}>
          <View style={[styles.banner, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.bannerText}>Tap what looks wrong — or tap ✕ to exit</Text>
            <Pressable onPress={() => setActive(false)} hitSlop={8} style={styles.bannerExit}>
              <Text style={styles.bannerAction}>Exit</Text>
            </Pressable>
          </View>
        </Pressable>
      ) : null}

      <View style={[styles.fabCluster, fabInset]} pointerEvents="box-none">
        {active ? (
          <Pressable
            accessibilityLabel="Exit report mode"
            onPress={() => {
              setActive(false);
              setShowPin(false);
            }}
            style={[styles.fab, styles.fabStop]}
          >
            <Text style={[styles.fabText, styles.fabStopText]}>✕</Text>
          </Pressable>
        ) : (
          <>
            {showPin ? (
              <View
                style={[
                  styles.pinRow,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                {DOCK_CORNER_PRESETS.map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => {
                      setCorner(preset);
                      setShowPin(false);
                    }}
                    style={[
                      styles.pinChip,
                      {
                        backgroundColor: corner === preset ? colors.primary : colors.muted,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: corner === preset ? colors.primaryForeground : colors.foreground,
                        fontSize: 11,
                      }}
                    >
                      {DOCK_CORNER_LABELS[preset]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.fabRow}>
              <Pressable
                accessibilityLabel="Pin report button position"
                onPress={() => setShowPin((value) => !value)}
                style={[
                  styles.pinButton,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>
                  Pin
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Start report mode"
                onPress={() => setActive(true)}
                style={[styles.fab, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.fabText, { color: colors.primaryForeground }]}>R</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <Modal visible={Boolean(tapPoint)} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              What looks wrong here?
            </Text>
            <TextInput
              autoFocus={true}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. button does nothing"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            />
            <View style={styles.modalActions}>
              <Pressable
                disabled={submitting || !note.trim()}
                onPress={() => void handleSubmit()}
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: colors.primaryForeground }}>Send</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setTapPoint(null);
                  setNote('');
                }}
              >
                <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fabCluster: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 4,
    alignItems: 'flex-end',
    gap: 8,
  },
  fabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pinRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    maxWidth: 220,
  },
  pinChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontWeight: '700',
    fontSize: 16,
  },
  fabStop: {
    backgroundColor: '#dc2626',
  },
  fabStopText: {
    color: '#ffffff',
    fontSize: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9998,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  banner: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerText: {
    color: '#451a03',
    fontSize: 13,
    flex: 1,
  },
  bannerAction: {
    color: '#451a03',
    fontWeight: '600',
  },
  bannerExit: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#451a03',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sendButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
