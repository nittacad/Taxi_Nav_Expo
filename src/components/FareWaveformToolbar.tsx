/**
 * FareWaveformToolbar.tsx
 * ズーム（− / 標準 / ＋）+ オーバーレイ選択
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import {
  DEFAULT_ZOOM_PX_PER_MINUTE,
  ZOOM_LEVELS,
  ZoomLevel,
} from '@/types/fareWaveform';

interface FareWaveformToolbarProps {
  zoom: ZoomLevel;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export const FareWaveformToolbar: React.FC<FareWaveformToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
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
    flex: 1,
    textAlign: 'right',
  },
});

export default FareWaveformToolbar;
