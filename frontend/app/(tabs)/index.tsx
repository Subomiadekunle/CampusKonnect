import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SERVICE_CATEGORIES } from '@/constants/service-categories';
import { getAllServiceListings, getCurrentUser, resolveApiAssetUrl, ServiceListing, UserProfile } from '@/lib/auth';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const isWideScreen = width >= 1200;

  useEffect(() => {
    Promise.allSettled([getAllServiceListings(), getCurrentUser()])
      .then(([listingsResult, profileResult]) => {
        if (listingsResult.status === 'fulfilled') {
          setListings(listingsResult.value);
        } else {
          setError(
            listingsResult.reason instanceof Error
              ? listingsResult.reason.message
              : 'Unable to load listings.'
          );
        }

        if (profileResult.status === 'fulfilled') {
          setProfile(profileResult.value);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const categories = useMemo(() => ['All', ...SERVICE_CATEGORIES], []);
  const visibleCategoryCount = useMemo(() => {
    if (width < 480) return 5;
    if (width < 768) return 7;
    if (width < 1024) return 9;
    return 11;
  }, [width]);
  const displayedCategories = showAllCategories
    ? categories
    : categories.slice(0, visibleCategoryCount);

  const apiListingsMapped = useMemo(() => {
    return listings.map((listing) => ({
      id: listing.id,
      title: listing.serviceTitle,
      seller: `Provider #${listing.ownerId}`,
      description: listing.description,
      price: listing.price,
      priceType: listing.priceType,
      imageUrl:
        (listing.imageUrls?.[0] ? resolveApiAssetUrl(listing.imageUrls[0]) : '') ||
        'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80',
      category: listing.category,
      availability: listing.availability,
      distance: listing.serviceArea,
    }));
  }, [listings]);

  const normalizedPreferences = useMemo(
    () => new Set((profile?.preferences ?? []).map((preference) => preference.toLowerCase())),
    [profile?.preferences]
  );

  const results = useMemo(() => {
    const filteredListings = apiListingsMapped.filter((listing) => {
      const matchesCategory = activeCategory === 'All' || listing.category === activeCategory;
      return matchesCategory;
    });

    if (normalizedPreferences.size === 0) {
      return filteredListings;
    }

    const preferredListings = filteredListings.filter((listing) =>
      normalizedPreferences.has(listing.category.toLowerCase())
    );
    const otherListings = filteredListings.filter(
      (listing) => !normalizedPreferences.has(listing.category.toLowerCase())
    );

    return [...preferredListings, ...otherListings];
  }, [activeCategory, apiListingsMapped, normalizedPreferences]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CampusKonnect</Text>
        <Text style={styles.headerSubtitle}>Find student services around campus</Text>
      </View>

      <View style={styles.categoryRow}>
        {displayedCategories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
            onPress={() => setActiveCategory(cat)}>
            <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
        {categories.length > visibleCategoryCount ? (
          <TouchableOpacity
            style={styles.moreChip}
            onPress={() => setShowAllCategories((current) => !current)}
          >
            <Text style={styles.moreChipText}>{showAllCategories ? '<<' : '>>'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#4FC3F7" />
          <Text style={styles.statusText}>Loading listings...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.statusText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false}>
          {results.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.statusText}>No live listings found yet.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {results.map((listing) => (
                <View key={listing.id} style={[styles.card, isWideScreen && styles.cardWide]}>
                  <Image
                    source={{
                      uri: listing.imageUrl,
                    }}
                    style={styles.cardImage}
                  />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{listing.title}</Text>
                      <Text style={styles.cardPrice}>${listing.price}/{listing.priceType}</Text>
                    </View>
                    <Text style={styles.cardSeller}>by {listing.seller}</Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>{listing.description}</Text>
                    <Text style={styles.cardMeta}>{listing.availability}  •  {listing.distance}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
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
  header: { backgroundColor: '#FFFFFF', paddingTop: 28, paddingBottom: 8, paddingHorizontal: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0D0D0D' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  categoryChipActive: { backgroundColor: '#4FC3F7', borderColor: '#4FC3F7' },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  categoryChipTextActive: { color: '#FFFFFF' },
  moreChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  moreChipText: { fontSize: 12, fontWeight: '800', color: '#334155' },
  gridContent: { paddingHorizontal: 16, paddingBottom: 36 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  card: {
    width: '100%',
    maxWidth: 760,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardWide: {
    width: 520,
    maxWidth: 520,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#E5E7EB',
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },
  cardPrice: { fontSize: 13, fontWeight: '800', color: '#2563EB' },
  cardSeller: { fontSize: 12, color: '#4B5563' },
  cardDescription: { fontSize: 12, color: '#6B7280', lineHeight: 17, minHeight: 34 },
  cardMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  statusText: { fontSize: 13, color: '#6B7280' },
});
