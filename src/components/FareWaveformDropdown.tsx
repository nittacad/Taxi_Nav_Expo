/**
 * FareWaveformDropdown.tsx
 * コンパクトなプルダウン選択（時間帯・破線オーバーレイ等）
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type DropdownOption<T extends string> = {
  id: T;
  label: string;
};

interface FareWaveformDropdownProps<T extends string> {
  label: string;
  value: T;
  options: readonly DropdownOption<T>[];
  onChange: (value: T) => void;
  modalTitle: string;
  style?: StyleProp<ViewStyle>;
  /** ラベルを上ではなく左に置くコンパクト行レイアウト */
  inline?: boolean;
}

export function FareWaveformDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  modalTitle,
  style,
  inline = false,
}: FareWaveformDropdownProps<T>): React.ReactElement {
  const [open, setOpen] = useState(false);
  const selectedLabel = useMemo(
    () => options.find((option) => option.id === value)?.label ?? label,
    [options, value, label],
  );

  return (
    <View style={[inline ? styles.inlineWrap : styles.wrap, style]}>
      <Text style={inline ? styles.inlineLabel : styles.label}>{label}</Text>
      <Pressable
        style={[styles.trigger, inline && styles.triggerInline]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${selectedLabel}`}
      >
        <Text style={styles.triggerText} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#7F8C8D" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropTap}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="閉じる"
          />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{modalTitle}</Text>
            <ScrollView style={styles.list} bounces={false}>
              {options.map((item) => {
                const selected = item.id === value;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark" size={18} color="#3498DB" />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  inlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  inlineLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F8C8D',
    flexShrink: 0,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  triggerInline: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 7,
  },
  triggerText: {
    flex: 1,
    fontSize: 12,
    color: '#2C3E50',
    fontWeight: '500',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: '70%',
    paddingTop: 12,
    overflow: 'hidden',
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  list: {
    maxHeight: 420,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  optionSelected: {
    backgroundColor: '#EBF5FB',
  },
  optionText: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#1B4965',
  },
});

export default FareWaveformDropdown;
