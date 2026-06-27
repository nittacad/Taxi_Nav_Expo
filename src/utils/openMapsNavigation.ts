import { Alert, Linking, Platform } from 'react-native';

export interface NavigationCoordinate {
  latitude: number;
  longitude: number;
}

export async function openMapsNavigation(
  coordinate: NavigationCoordinate,
  label?: string
): Promise<void> {
  const destination = `${coordinate.latitude},${coordinate.longitude}`;
  const googleMapsUrl =
    Platform.select({
      ios: `comgooglemaps://?daddr=${destination}&directionsmode=driving`,
      android: `google.navigation:q=${destination}&mode=d`,
    }) ?? '';
  const appleMapsUrl = label
    ? `http://maps.apple.com/?daddr=${encodeURIComponent(label)}&dirflg=d`
    : `http://maps.apple.com/?daddr=${destination}&dirflg=d`;

  try {
    const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
    if (canOpenGoogleMaps) {
      await Linking.openURL(googleMapsUrl);
      return;
    }
    await Linking.openURL(appleMapsUrl);
  } catch {
    Alert.alert('エラー', 'マップアプリを起動できませんでした。');
  }
}
