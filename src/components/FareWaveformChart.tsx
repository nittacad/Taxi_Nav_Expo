/**
 * FareWaveformChart.tsx
 * 出口別運賃 + オーバーレイ（横スクロール・ズーム対応）
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Line, Polyline, Rect, Text as SvgText, G, Circle } from 'react-native-svg';

import { JR_BASE_FARE, seriesMax } from '@/data/fareWaveformEngine';
import {
  AirportArrivalHighlight,
  ExitFareWaveformSeries,
  FareWaveformLayerVisibility,
  OverlayMode,
} from '@/types/fareWaveform';

interface FareWaveformChartProps {
  timeLabels: string[];
  exits: ExitFareWaveformSeries[];
  totalCapacityByMinute: number[];
  trainCountByMinute: number[];
  overlayMode: OverlayMode;
  layerVisibility: FareWaveformLayerVisibility;
  airportHighlights?: AirportArrivalHighlight[];
  pxPerMinute: number;
  height?: number;
}

const CHART_PADDING = {
  top: 20,
  right: 52,
  bottom: 36,
  left: 56,
};

function isExitVisible(
  exitId: string,
  visibility: FareWaveformLayerVisibility,
): boolean {
  return visibility[exitId] ?? true;
}

function buildPolylinePoints(
  values: number[],
  plotWidth: number,
  plotHeight: number,
  minValue: number,
  maxValue: number,
): string {
  if (values.length === 0) {
    return '';
  }

  const range = maxValue - minValue || 1;
  const stepX = plotWidth / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = index * stepX;
      const normalized = (value - minValue) / range;
      const y = plotHeight - normalized * plotHeight;
      return `${x},${y}`;
    })
    .join(' ');
}

function valueToY(
  value: number,
  plotHeight: number,
  minValue: number,
  maxValue: number,
): number {
  const range = maxValue - minValue || 1;
  const normalized = (value - minValue) / range;
  return plotHeight - normalized * plotHeight;
}

export const FareWaveformChart: React.FC<FareWaveformChartProps> = ({
  timeLabels,
  exits,
  totalCapacityByMinute,
  trainCountByMinute,
  overlayMode,
  layerVisibility,
  airportHighlights = [],
  pxPerMinute,
  height = 280,
}) => {
  const slotCount = timeLabels.length;
  const chartWidth = Math.max(slotCount * pxPerMinute, 480);
  const innerWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  const visibleExits = useMemo(
    () => exits.filter((exit) => isExitVisible(exit.exitId, layerVisibility)),
    [exits, layerVisibility],
  );

  const overlayActive = overlayMode !== 'off';
  const overlayData =
    overlayMode === 'trainCount' ? trainCountByMinute : totalCapacityByMinute;

  const fareMax = useMemo(() => {
    if (visibleExits.length === 0) {
      return Math.max(JR_BASE_FARE, 1000);
    }
    let max = JR_BASE_FARE;
    for (const exit of visibleExits) {
      max = seriesMax(exit.fareByMinute, max);
    }
    return max;
  }, [visibleExits]);

  const overlayMax = useMemo(() => {
    if (!overlayActive) {
      return 1;
    }
    return seriesMax(overlayData, 1);
  }, [overlayActive, overlayData]);

  const labelStep =
    timeLabels.length > 480
      ? 60
      : timeLabels.length > 240
        ? 30
        : pxPerMinute >= 14
          ? 5
          : pxPerMinute >= 10
            ? 10
            : pxPerMinute >= 6
              ? 15
              : 20;

  const fareTicks = useMemo(
    () => [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(fareMax * t)),
    [fareMax],
  );

  const overlayTicks = useMemo(
    () => [0, 0.5, 1].map((t) => Math.round(overlayMax * t)),
    [overlayMax],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={{ minWidth: chartWidth }}
      >
        <Svg width={chartWidth} height={height}>
          <Rect
            x={CHART_PADDING.left}
            y={CHART_PADDING.top}
            width={innerWidth}
            height={innerHeight}
            fill="#FAFAFA"
            stroke="#E0E0E0"
          />

          {fareTicks.map((tick) => {
            const y =
              CHART_PADDING.top + valueToY(tick, innerHeight, 0, fareMax);
            return (
              <G key={`fare-grid-${tick}`}>
                <Line
                  x1={CHART_PADDING.left}
                  y1={y}
                  x2={CHART_PADDING.left + innerWidth}
                  y2={y}
                  stroke="#ECF0F1"
                  strokeWidth={1}
                />
                <SvgText
                  x={CHART_PADDING.left - 8}
                  y={y + 4}
                  fontSize={10}
                  fill="#7F8C8D"
                  textAnchor="end"
                >
                  {tick >= 1000 ? `${Math.round(tick / 1000)}k` : tick}
                </SvgText>
              </G>
            );
          })}

          {overlayActive &&
            overlayTicks.map((tick) => {
              const y =
                CHART_PADDING.top + valueToY(tick, innerHeight, 0, overlayMax);
              return (
                <SvgText
                  key={`ov-tick-${tick}`}
                  x={CHART_PADDING.left + innerWidth + 8}
                  y={y + 4}
                  fontSize={10}
                  fill="#7F8C8D"
                  textAnchor="start"
                >
                  {tick}
                </SvgText>
              );
            })}

          <Line
            x1={CHART_PADDING.left}
            y1={
              CHART_PADDING.top + valueToY(JR_BASE_FARE, innerHeight, 0, fareMax)
            }
            x2={CHART_PADDING.left + innerWidth}
            y2={
              CHART_PADDING.top + valueToY(JR_BASE_FARE, innerHeight, 0, fareMax)
            }
            stroke="#BDC3C7"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          <G x={CHART_PADDING.left} y={CHART_PADDING.top}>
            {visibleExits.map((exit) => (
              <Polyline
                key={exit.exitId}
                points={buildPolylinePoints(
                  exit.fareByMinute,
                  innerWidth,
                  innerHeight,
                  0,
                  fareMax,
                )}
                fill="none"
                stroke={exit.color}
                strokeWidth={pxPerMinute >= 10 ? 1.8 : 1.4}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {overlayActive && (
              <Polyline
                points={buildPolylinePoints(
                  overlayData,
                  innerWidth,
                  innerHeight,
                  0,
                  overlayMax,
                )}
                fill="none"
                stroke="#7F8C8D"
                strokeWidth={2}
                strokeDasharray="6,4"
                strokeLinejoin="round"
                opacity={0.85}
              />
            )}
          </G>

          {timeLabels.map((label, index) => {
            if (index % labelStep !== 0 && index !== slotCount - 1) {
              return null;
            }
            const x =
              CHART_PADDING.left +
              (index / Math.max(slotCount - 1, 1)) * innerWidth;
            return (
              <G key={`x-${label}-${index}`}>
                <Line
                  x1={x}
                  y1={CHART_PADDING.top + innerHeight}
                  x2={x}
                  y2={CHART_PADDING.top + innerHeight + 4}
                  stroke="#E0E0E0"
                  strokeWidth={1}
                />
                <SvgText
                  x={x}
                  y={height - 12}
                  fontSize={pxPerMinute >= 10 ? 11 : 10}
                  fill="#7F8C8D"
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              </G>
            );
          })}

          <SvgText
            x={8}
            y={CHART_PADDING.top + innerHeight / 2}
            fontSize={11}
            fill="#7F8C8D"
            transform={`rotate(-90 8 ${CHART_PADDING.top + innerHeight / 2})`}
            textAnchor="middle"
          >
            最高鉄道運賃（円）
          </SvgText>

          {overlayActive && (
            <SvgText
              x={chartWidth - 6}
              y={CHART_PADDING.top + innerHeight / 2}
              fontSize={11}
              fill="#7F8C8D"
              transform={`rotate(90 ${chartWidth - 6} ${CHART_PADDING.top + innerHeight / 2})`}
              textAnchor="middle"
            >
              {overlayMode === 'trainCount'
                ? '到着本数（本/分）'
                : '収容人数（人/分）'}
            </SvgText>
          )}

          {airportHighlights.map((highlight, index) => {
            const x =
              CHART_PADDING.left +
              (highlight.minuteIndex / Math.max(slotCount - 1, 1)) * innerWidth;
            return (
              <G key={`airport-${highlight.minuteIndex}-${index}`}>
                <Line
                  x1={x}
                  y1={CHART_PADDING.top}
                  x2={x}
                  y2={CHART_PADDING.top + innerHeight}
                  stroke={highlight.markerColor}
                  strokeWidth={1}
                  strokeDasharray="3,4"
                  opacity={0.35}
                />
                <Circle
                  cx={x}
                  cy={CHART_PADDING.top - 5}
                  r={4}
                  fill={highlight.markerColor}
                />
                <SvgText
                  x={x}
                  y={CHART_PADDING.top - 10}
                  fontSize={8}
                  fill={highlight.markerColor}
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {highlight.shortLabel}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
});

export default FareWaveformChart;
