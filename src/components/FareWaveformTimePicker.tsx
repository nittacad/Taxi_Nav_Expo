/**
 * FareWaveformTimePicker.tsx
 * 時間帯プルダウン（始発〜終電 + 2時間スロット）
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { listTimePresetOptions, resolveTimeRange } from '@/data/fareWaveformEngine';
import { TimePreset } from '@/types/fareWaveform';

interface FareWaveformTimePickerProps {
  value: TimePreset;
  onChange: (preset: TimePreset) => void;
}

export const FareWaveformTimePicker: React.FC<FareWaveformTimePickerProps> = ({
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => listTimePresetOptions(), []);
  const selectedLabel = resolveTimeRange(value).label;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>時間帯</Text>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`時間帯 ${selectedLabel}`}
      >
        <Text style={styles.triggerText} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#7F8C8D" />
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
            <Text style={styles.sheetTitle}>時間帯を選択</Text>
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
};

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  triggerText: {
    flex: 1,
    fontSize: 13,
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

export default FareWaveformTimePicker;
