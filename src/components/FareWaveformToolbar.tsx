/**
 * FareWaveformToolbar.tsx
 * ズーム（− / 標準 / ＋）+ オーバーレイ選択
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import {
  DEFAULT_ZOOM_PX_PER_MINUTE,
  OVERLAY_MODE_LABELS,
  OverlayMode,
  ZOOM_LEVELS,
  ZoomLevel,
} from '@/types/fareWaveform';

interface FareWaveformToolbarProps {
  zoom: ZoomLevel;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  overlayMode: OverlayMode;
  onOverlayChange: (mode: OverlayMode) => void;
}

const OVERLAY_MODES: OverlayMode[] = ['off', 'capacity', 'trainCount'];

export const FareWaveformToolbar: React.FC<FareWaveformToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  overlayMode,
  onOverlayChange,
}) => {
  const atMin = zoom === ZOOM_LEVELS[0];
  const atMax = zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  const isDefault = zoom === DEFAULT_ZOOM_PX_PER_MINUTE;

  return (
    <View style={styles.toolbar}>
      <Text style={styles.label}>拡大</Text>
      <Pressable
        style={[styles.btn, atMin && styles.btnDisabled]}
        onPress={onZoomOut}
        disabled={atMin}
      >
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, isDefault && styles.btnDisabled]}
        onPress={onZoomReset}
        disabled={isDefault}
      >
        <Text style={styles.btnTextSmall}>標準</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, atMax && styles.btnDisabled]}
        onPress={onZoomIn}
        disabled={atMax}
      >
        <Text style={styles.btnText}>＋</Text>
      </Pressable>
      <Text style={styles.hint}>{zoom}px/分</Text>

      <View style={styles.divider} />

      <Text style={styles.label}>破線</Text>
      <View style={styles.overlayRow}>
        {OVERLAY_MODES.map((mode) => {
          const selected = overlayMode === mode;
          return (
            <Pressable
              key={mode}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onOverlayChange(mode)}
            >
              <Text
                style={[styles.chipText, selected && styles.chipTextSelected]}
              >
                {OVERLAY_MODE_LABELS[mode]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
  },
  btn: {
    minWidth: 36,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  btnTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
  },
  hint: {
    fontSize: 11,
    color: '#95A5A6',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  overlayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
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
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});

export default FareWaveformToolbar;
