import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import axios from 'axios';

import { getCurrentUser } from '@/lib/auth';
import CampusMap from '@/components/CampusMap';
import { MOCK_MAP_LISTINGS } from '@/components/GoogleMapView';

type Coords = { latitude: number; longitude: number };

async function geocodeUniversity(name: string): Promise<Coords | null> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: name, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'CampusKonnect/1.0' },
    });
    const result = response.data[0];
    if (!result) return null;
    return { latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) };
  } catch {
    return null;
  }
}

export default function HomeScreen() {
  const [campusCoords, setCampusCoords] = useState<Coords | null>(null);
  const [university, setUniversity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<(typeof MOCK_MAP_LISTINGS)[0] | null>(null);

  useEffect(() => {
    getCurrentUser().then((profile) => {
      if (profile.university) {
        setUniversity(profile.university);
        geocodeUniversity(profile.university).then((coords) => {
          setCampusCoords(coords);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4FC3F7" />
        <Text style={styles.loadingText}>Loading campus map...</Text>
      </View>
    );
  }

  if (!university) {
    return (
      <View style={styles.centered}>
        <Text style={styles.promptTitle}>Welcome to CampusKonnect</Text>
        <Text style={styles.promptSubtitle}>
          Go to Account and add your university to see services near your campus.
        </Text>
      </View>
    );
  }

  if (!campusCoords) {
    return (
      <View style={styles.centered}>
        <Text style={styles.promptTitle}>Could not find your campus</Text>
        <Text style={styles.promptSubtitle}>
          Try updating your university name in Account.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Listings</Text>
        <Text style={styles.headerUniversity}>{university}</Text>
      </View>
      <CampusMap
        campusCoords={campusCoords}
        listings={MOCK_MAP_LISTINGS}
        selectedListing={selectedListing}
        onSelectListing={setSelectedListing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 32,
    gap: 12,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 52 : 40,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4FD',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0D0D0D' },
  headerUniversity: { fontSize: 13, fontWeight: '600', color: '#1976D2', marginTop: 2 },
  loadingText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
  promptTitle: { fontSize: 20, fontWeight: '700', color: '#0D0D0D', textAlign: 'center' },
  promptSubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
});
