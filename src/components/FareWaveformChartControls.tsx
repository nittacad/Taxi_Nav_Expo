/**
 * FareWaveformChartControls.tsx
 * 拡大縮小 + 破線オーバーレイ（同行・コンパクト）
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { FareWaveformDropdown } from '@/components/FareWaveformDropdown';
import {
  OVERLAY_MODE_LABELS,
  OverlayMode,
  ZOOM_LEVELS,
  ZoomLevel,
} from '@/types/fareWaveform';

const OVERLAY_MODES: OverlayMode[] = ['off', 'capacity', 'trainCount'];

interface FareWaveformChartControlsProps {
  zoom: ZoomLevel;
  defaultZoom: ZoomLevel;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  overlayMode: OverlayMode;
  onOverlayChange: (mode: OverlayMode) => void;
}

export const FareWaveformChartControls: React.FC<FareWaveformChartControlsProps> = ({
  zoom,
  defaultZoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  overlayMode,
  onOverlayChange,
}) => {
  const atMin = zoom === ZOOM_LEVELS[0];
  const atMax = zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  const isDefault = zoom === defaultZoom;

  const overlayOptions = useMemo(
    () =>
      OVERLAY_MODES.map((mode) => ({
        id: mode,
        label: OVERLAY_MODE_LABELS[mode],
      })),
    [],
  );

  return (
    <View style={styles.row}>
      <View style={styles.zoomGroup}>
        <Text style={styles.groupLabel}>拡大</Text>
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
        <Text style={styles.hint}>{zoom}px</Text>
      </View>

      <View style={styles.divider} />

      <FareWaveformDropdown
        label="破線"
        inline
        value={overlayMode}
        options={overlayOptions}
        onChange={onOverlayChange}
        modalTitle="破線オーバーレイ"
        style={styles.overlayDropdown}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  zoomGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  btn: {
    minWidth: 30,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  btnTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2C3E50',
  },
  hint: {
    fontSize: 10,
    color: '#95A5A6',
    minWidth: 28,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
  },
  overlayDropdown: {
    flex: 1,
    minWidth: 0,
  },
});

export default FareWaveformChartControls;
