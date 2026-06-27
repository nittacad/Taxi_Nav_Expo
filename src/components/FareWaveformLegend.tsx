/**
 * FareWaveformLegend.tsx
 * 色付き凡例 + 出口と路線（展開）
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { contrastCheckColor } from '@/data/fareWaveformEngine';
import {
  ExitFareWaveformSeries,
  FareWaveformLayerVisibility,
} from '@/types/fareWaveform';

interface ColoredLegendCheckProps {
  color: string;
  checked: boolean;
  label: string;
  onToggle: () => void;
}

const ColoredLegendCheck: React.FC<ColoredLegendCheckProps> = ({
  color,
  checked,
  label,
  onToggle,
}) => (
  <Pressable
    style={[styles.legendItem, { opacity: checked ? 1 : 0.5 }]}
    onPress={onToggle}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
  >
    <View
      style={[
        styles.colorBox,
        {
          borderColor: color,
          backgroundColor: checked ? color : 'transparent',
        },
      ]}
    >
      {checked && (
        <Ionicons
          name="checkmark"
          size={13}
          color={contrastCheckColor(color)}
        />
      )}
    </View>
    <Text style={styles.legendLabel}>{label}</Text>
  </Pressable>
);

interface FareWaveformLegendProps {
  exits: ExitFareWaveformSeries[];
  layerVisibility: FareWaveformLayerVisibility;
  onToggle: (exitId: string) => void;
}

export const FareWaveformLegend: React.FC<FareWaveformLegendProps> = ({
  exits,
  layerVisibility,
  onToggle,
}) => {
  const [routesOpen, setRoutesOpen] = useState(false);

  return (
    <View style={styles.panel}>
      <Pressable
        style={styles.panelHeader}
        onPress={() => setRoutesOpen((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: routesOpen }}
      >
        <Text style={styles.panelTitle}>凡例</Text>
        <Text style={styles.panelHint}>
          {routesOpen ? '▾ 出口と路線' : '▸ 出口と路線'}
        </Text>
      </Pressable>

      <View style={styles.legendRow}>
        {exits.map((exit) => (
          <ColoredLegendCheck
            key={exit.exitId}
            color={exit.color}
            checked={layerVisibility[exit.exitId] ?? true}
            label={exit.exitName}
            onToggle={() => onToggle(exit.exitId)}
          />
        ))}
      </View>

      {routesOpen && (
        <View style={styles.routesSection}>
          {exits.map((exit) => (
            <View key={`route-${exit.exitId}`} style={styles.routeRow}>
              <View style={[styles.routeDot, { backgroundColor: exit.color }]} />
              <View style={styles.routeText}>
                <Text style={styles.routeName}>{exit.exitName}</Text>
                <Text style={styles.routeLines}>{exit.lines}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  panelHint: {
    fontSize: 12,
    color: '#95A5A6',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorBox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendLabel: {
    fontSize: 13,
    color: '#2C3E50',
  },
  routesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 10,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginTop: 3,
  },
  routeText: {
    flex: 1,
    gap: 2,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  routeLines: {
    fontSize: 12,
    color: '#7F8C8D',
    lineHeight: 17,
  },
});

export default FareWaveformLegend;
