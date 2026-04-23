import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import CampusMap from '@/components/CampusMap';

import { getCurrentUser } from '@/lib/auth';

type MockListing = {
  id: number;
  title: string;
  category: string;
  price: string;
  priceType: string;
  area: string;
  seller: string;
  latOffset: number;
  lngOffset: number;
};

const MOCK_LISTINGS: MockListing[] = [
  { id: 1, title: 'Gel Nails & Nail Art', category: 'Nails', price: '35', priceType: 'set', area: 'South Campus', seller: 'Aisha K.', latOffset: 0.0012, lngOffset: -0.0008 },
  { id: 2, title: 'Portrait Photography', category: 'Photography', price: '60', priceType: 'hour', area: 'Main Quad', seller: 'Marcus T.', latOffset: -0.0005, lngOffset: 0.0015 },
  { id: 3, title: 'Professional Headshots', category: 'Headshots', price: '45', priceType: 'set', area: 'Library', seller: 'Jordan L.', latOffset: 0.0003, lngOffset: -0.0012 },
  { id: 4, title: 'Box Braids & Knotless Braids', category: 'Hair Braiding', price: '80', priceType: 'set', area: 'Dorm Area', seller: 'Fatima O.', latOffset: -0.0018, lngOffset: 0.0006 },
  { id: 5, title: 'Full Glam Makeup', category: 'Makeup', price: '50', priceType: 'set', area: 'North Campus', seller: 'Zoe M.', latOffset: 0.0020, lngOffset: 0.0003 },
  { id: 6, title: 'Calculus & Stats Tutoring', category: 'Tutoring', price: '25', priceType: 'hour', area: 'Science Building', seller: 'David P.', latOffset: -0.0007, lngOffset: -0.0018 },
  { id: 7, title: 'Logo & Brand Design', category: 'Graphic Design', price: '40', priceType: 'hour', area: 'Remote', seller: 'Priya S.', latOffset: 0.0015, lngOffset: 0.0010 },
  { id: 8, title: 'YouTube Video Editing', category: 'Video Editing', price: '30', priceType: 'hour', area: 'Remote', seller: 'Chris W.', latOffset: -0.0010, lngOffset: 0.0020 },
  { id: 9, title: 'Custom Beat Production', category: 'Music Production', price: '75', priceType: 'track', area: 'Remote', seller: 'Elijah R.', latOffset: 0.0008, lngOffset: -0.0005 },
  { id: 10, title: 'Party & Event DJ', category: 'DJing', price: '150', priceType: 'event', area: 'Campus-wide', seller: 'Tyler B.', latOffset: -0.0014, lngOffset: -0.0010 },
  { id: 11, title: 'Personal Training', category: 'Personal Training', price: '30', priceType: 'hour', area: 'Campus Gym', seller: 'Maya J.', latOffset: 0.0006, lngOffset: 0.0018 },
  { id: 12, title: 'Custom Cakes & Cupcakes', category: 'Baking & Sweets', price: '40', priceType: 'order', area: 'West Campus', seller: 'Olivia H.', latOffset: -0.0003, lngOffset: -0.0015 },
  { id: 13, title: 'Room Deep Clean', category: 'Cleaning', price: '20', priceType: 'hour', area: 'All Dorms', seller: 'Sam G.', latOffset: 0.0018, lngOffset: -0.0003 },
  { id: 14, title: 'Clothing Alterations', category: 'Fashion / Alterations', price: '15', priceType: 'item', area: 'East Hall', seller: 'Nina C.', latOffset: -0.0020, lngOffset: 0.0012 },
  { id: 15, title: 'Laptop Repair & Setup', category: 'Tech Support', price: '25', priceType: 'hour', area: 'Tech Center', seller: 'Taylor K.', latOffset: 0.0010, lngOffset: -0.0020 },
];

const CATEGORIES = ['All', 'Nails', 'Photography', 'Headshots', 'Hair Braiding', 'Makeup', 'Tutoring', 'Graphic Design', 'Video Editing', 'Music Production', 'DJing', 'Personal Training', 'Baking & Sweets', 'Cleaning', 'Fashion / Alterations', 'Tech Support'];

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

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [campusCoords, setCampusCoords] = useState<Coords | null>(null);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [university, setUniversity] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<MockListing | null>(null);

  useEffect(() => {
    getCurrentUser().then((profile) => {
      if (profile.university) {
        setUniversity(profile.university);
        setIsGeocodingLoading(true);
        geocodeUniversity(profile.university).then((coords) => {
          setCampusCoords(coords);
          setIsGeocodingLoading(false);
        });
      }
    });
  }, []);

  const results = useMemo(() => {
    return MOCK_LISTINGS.filter((l) => {
      const matchesCategory = activeCategory === 'All' || l.category === activeCategory;
      const matchesQuery =
        query.trim() === '' ||
        l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.category.toLowerCase().includes(query.toLowerCase()) ||
        l.seller.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  const renderHeader = () => (
    <View style={styles.header}>
      {university ? (
        <Text style={styles.campusLabel}>{university}</Text>
      ) : (
        <Text style={styles.campusLabelEmpty}>Set your university in Account to see your campus map</Text>
      )}

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>&#x1F50D;</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search services, categories, sellers..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>x</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.controlRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
              onPress={() => setActiveCategory(cat)}>
              <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
            onPress={() => setView('list')}>
            <Text style={[styles.toggleBtnText, view === 'list' && styles.toggleBtnTextActive]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'map' && styles.toggleBtnActive]}
            onPress={() => setView('map')}>
            <Text style={[styles.toggleBtnText, view === 'map' && styles.toggleBtnTextActive]}>Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (view === 'map') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderHeader()}

        {!university ? (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderTitle}>No university set</Text>
            <Text style={styles.mapPlaceholderSubtitle}>Go to Account and add your university to see the campus map.</Text>
          </View>
        ) : isGeocodingLoading ? (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color={LIGHT_BLUE} />
            <Text style={styles.mapPlaceholderSubtitle}>Loading campus map...</Text>
          </View>
        ) : !campusCoords ? (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderTitle}>Could not find campus</Text>
            <Text style={styles.mapPlaceholderSubtitle}>Try updating your university name in Account.</Text>
          </View>
        ) : (
          <CampusMap
            campusCoords={campusCoords}
            listings={results}
            selectedListing={selectedListing}
            onSelectListing={setSelectedListing}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {renderHeader()}

      <ScrollView contentContainerStyle={styles.results} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultsCount}>
          {results.length} {results.length === 1 ? 'result' : 'results'}
          {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
          {query.trim() ? ` for "${query}"` : ''}
        </Text>

        {results.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>Try a different search or category</Text>
          </View>
        ) : (
          results.map((item) => (
            <View key={item.id} style={styles.listingCard}>
              <View style={styles.listingColorBar} />
              <View style={styles.listingInfo}>
                <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.listingSeller}>by {item.seller} · {item.area}</Text>
                <View style={styles.listingFooter}>
                  <View style={styles.catBadge}>
                    <Text style={styles.catBadgeText}>{item.category}</Text>
                  </View>
                  <Text style={styles.listingPrice}>${item.price}/{item.priceType}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const LIGHT_BLUE = '#4FC3F7';
const BLACK = '#0D0D0D';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    backgroundColor: WHITE,
    paddingTop: Platform.OS === 'ios' ? 52 : 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4FD',
    gap: 10,
  },
  campusLabel: { fontSize: 13, fontWeight: '700', color: '#1976D2' },
  campusLabelEmpty: { fontSize: 12, color: '#9CA3AF' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 15, color: '#9CA3AF' },
  searchInput: { flex: 1, fontSize: 15, color: BLACK },
  clearBtn: { fontSize: 13, color: '#9CA3AF', fontWeight: '700' },

  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryRow: { gap: 8, paddingVertical: 2, flex: 1 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: { backgroundColor: LIGHT_BLUE, borderColor: LIGHT_BLUE },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  catChipTextActive: { color: WHITE },

  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: WHITE, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  toggleBtnTextActive: { color: BLACK },

  results: { padding: 16, gap: 12, paddingBottom: 40 },
  resultsCount: { fontSize: 13, color: '#607D8B', fontWeight: '500', marginBottom: 4 },

  listingCard: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8F4FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  listingColorBar: { width: 4, backgroundColor: LIGHT_BLUE },
  listingInfo: { flex: 1, padding: 14, gap: 3 },
  listingTitle: { fontSize: 15, fontWeight: '700', color: BLACK },
  listingSeller: { fontSize: 12, color: '#607D8B' },
  listingFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  catBadge: { backgroundColor: '#E8F4FD', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { fontSize: 11, fontWeight: '600', color: '#1976D2' },
  listingPrice: { fontSize: 14, fontWeight: '700', color: '#0D47A1' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: BLACK },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF' },

  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  mapPlaceholderTitle: { fontSize: 18, fontWeight: '700', color: BLACK },
  mapPlaceholderSubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

});
