import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { buildMapHtml, MapCoords, MapListing } from './GoogleMapView.ts';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

type Props = {
  campusCoords: MapCoords;
  listings: MapListing[];
  selectedListing: MapListing | null;
  onSelectListing: (listing: MapListing | null) => void;
};

export default function CampusMap({ campusCoords, listings, selectedListing, onSelectListing }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = buildMapHtml(
    GOOGLE_MAPS_API_KEY,
    campusCoords,
    listings,
    String(selectedListing?.id ?? '')
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      try {
        const payload = JSON.parse(String(event.data)) as {
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

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [listings, onSelectListing]);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Campus Map"
        sandbox="allow-scripts allow-same-origin allow-popups"
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
});
