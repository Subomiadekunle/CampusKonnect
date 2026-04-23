import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { buildMapHtml, MapCoords, MapListing } from './GoogleMapView';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

type Props = {
  campusCoords: MapCoords;
  listings: MapListing[];
  selectedListing: MapListing | null;
  onSelectListing: (listing: MapListing | null) => void;
};

export default function CampusMap({ campusCoords, listings }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = buildMapHtml(GOOGLE_MAPS_API_KEY, campusCoords, listings, '');

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
  container: { flex: 1 },
});
