import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout, LatLng } from 'react-native-maps';
import { openMapsNavigation } from '@/utils/openMapsNavigation';

export interface MapPinProps {
  coordinate: LatLng;
  title: string;
  demandScore: number;
  color: string;
  facilityType?: string;
  onPress?: () => void;
}

export const MapPin: React.FC<MapPinProps> = ({
  coordinate,
  title,
  demandScore,
  color,
  facilityType = 'station',
  onPress,
}) => {
  const handleCalloutPress = () => {
    void openMapsNavigation(coordinate, title);
  };

  const isHotel = facilityType === 'hotel';
  const displayIcon = isHotel ? '🏨' : '🚉';

  return (
    <Marker coordinate={coordinate} onPress={onPress}>
      <View style={[styles.pinContainer, { backgroundColor: color, borderRadius: isHotel ? 8 : 18 }]}>
        <Text style={styles.pinText}>{isHotel ? 'H' : demandScore}</Text>
      </View>
      <Callout tooltip onPress={handleCalloutPress}>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{displayIcon} {title}</Text>
          <Text style={styles.calloutSubtitle}>待ち客数: {demandScore}人</Text>
          <View style={styles.navButton}>
            <Text style={styles.navButtonText}>📍 ここへナビ</Text>
          </View>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  pinContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  pinText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  calloutContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#333333',
  },
  calloutSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  navButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
