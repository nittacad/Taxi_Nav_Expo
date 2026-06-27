/**
 * FareWaveformFilterRow.tsx
 * 曜日 + 時間帯を同行でコンパクト表示
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { FareWaveformDropdown } from '@/components/FareWaveformDropdown';
import { listTimePresetOptions } from '@/data/fareWaveformEngine';
import {
  DAY_CATEGORY_LABELS,
  DayCategory,
  TimePreset,
} from '@/types/fareWaveform';

const DAY_CATEGORIES: DayCategory[] = ['weekday', 'weekend_holiday'];

interface FareWaveformFilterRowProps {
  dayCategory: DayCategory;
  onDayCategoryChange: (category: DayCategory) => void;
  timePreset: TimePreset;
  onTimePresetChange: (preset: TimePreset) => void;
}

export const FareWaveformFilterRow: React.FC<FareWaveformFilterRowProps> = ({
  dayCategory,
  onDayCategoryChange,
  timePreset,
  onTimePresetChange,
}) => {
  const timeOptions = useMemo(() => listTimePresetOptions(), []);

  return (
    <View style={styles.row}>
      <View style={styles.dayGroup}>
        <Text style={styles.groupLabel}>曜日</Text>
        <View style={styles.dayChips}>
          {DAY_CATEGORIES.map((category) => {
            const selected = dayCategory === category;
            return (
              <Pressable
                key={category}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => onDayCategoryChange(category)}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {DAY_CATEGORY_LABELS[category]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FareWaveformDropdown
        label="時間"
        inline
        value={timePreset}
        options={timeOptions.map((option) => ({
          id: option.id,
          label: option.label,
        }))}
        onChange={onTimePresetChange}
        modalTitle="時間帯を選択"
        style={styles.timeDropdown}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayGroup: {
    flexShrink: 0,
    gap: 4,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  dayChips: {
    flexDirection: 'row',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#ECF0F1',
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  chipSelected: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  chipText: {
    fontSize: 11,
    color: '#2C3E50',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  timeDropdown: {
    flex: 1,
    minWidth: 0,
  },
});

export default FareWaveformFilterRow;
