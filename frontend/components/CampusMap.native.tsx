import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { buildMapHtml, MapCoords, MapListing } from './GoogleMapView';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

type Props = {
  campusCoords: MapCoords;
  listings: MapListing[];
  selectedListing: MapListing | null;
  onSelectListing: (listing: MapListing | null) => void;
};

export default function CampusMap({ campusCoords, listings }: Props) {
  const html = buildMapHtml(GOOGLE_MAPS_API_KEY, campusCoords, listings, '');

  return (
    <WebView
      style={styles.map}
      source={{ html }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
    />
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
