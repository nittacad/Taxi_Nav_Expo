import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface TimerProps {
  initialSeconds: number;
  onExpire?: () => void;
}

export const Timer: React.FC<TimerProps> = ({ initialSeconds, onExpire }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      if (onExpire) {
        onExpire();
      }
      return;
    }

    const intervalId = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [seconds, onExpire]);

  // 残り時間に応じた色を決定
  const getColor = () => {
    if (seconds > 60) return '#4CAF50'; // 緑
    if (seconds > 30) return '#FFEB3B'; // 黄
    return '#F44336'; // 赤
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: getColor() }]}>
      <Text style={styles.timeText}>{formatTime(seconds)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
});
