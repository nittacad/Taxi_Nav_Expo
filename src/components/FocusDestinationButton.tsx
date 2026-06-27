import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { openMapsNavigation } from '@/utils/openMapsNavigation';

export interface FocusDestinationButtonProps {
  label: string;
  latitude: number;
  longitude: number;
  onDismiss?: () => void;
}

export function FocusDestinationButton({
  label,
  latitude,
  longitude,
  onDismiss,
}: FocusDestinationButtonProps): React.ReactElement {
  const handleNavigate = () => {
    void openMapsNavigation({ latitude, longitude }, label);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.navButton} onPress={handleNavigate} activeOpacity={0.85}>
        <Text style={styles.navButtonText} numberOfLines={1}>
          📍 {label}へナビ
        </Text>
      </TouchableOpacity>
      {onDismiss ? (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss} hitSlop={8}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 28,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  navButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    maxWidth: 280,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEEEEE',
  },
  dismissText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '700',
  },
});
