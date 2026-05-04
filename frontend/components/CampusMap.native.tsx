import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { buildMapHtml, MapCoords, MapListing } from './GoogleMapView';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

type Props = {
  campusCoords: MapCoords;
  listings: MapListing[];
  selectedListing: MapListing | null;
  onSelectListing: (listing: MapListing | null) => void;
};

export default function CampusMap({ campusCoords, listings, selectedListing, onSelectListing }: Props) {
  const html = buildMapHtml(
    GOOGLE_MAPS_API_KEY,
    campusCoords,
    listings,
    String(selectedListing?.id ?? '')
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        listingId?: number | null;
      };

      if (payload.type !== 'listing-selected') {
        return;
      }

      const nextListing = listings.find((listing) => listing.id === payload.listingId) ?? null;
      onSelectListing(nextListing);
    } catch {
      onSelectListing(null);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#E8F4FD',
    overflow: 'hidden',
    backgroundColor: '#DFF1FB',
  },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
