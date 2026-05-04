import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import axios from 'axios';
import CampusMap from '@/components/CampusMap.tsx';
import { MapListing } from '@/components/GoogleMapView';
import { SERVICE_CATEGORIES } from '@/constants/service-categories';

import { getAllServiceListings, getCurrentUser, resolveApiAssetUrl, ServiceListing } from '@/lib/auth';

const CATEGORIES = ['All', ...SERVICE_CATEGORIES];

type Coords = { latitude: number; longitude: number };

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function getSearchScore(listing: ServiceListing, rawQuery: string) {
  const query = normalizeSearchValue(rawQuery);
  if (!query) {
    return 0;
  }

  const tokens = query.split(/\s+/).filter(Boolean);
  const title = normalizeSearchValue(listing.serviceTitle);
  const category = normalizeSearchValue(listing.category);
  const area = normalizeSearchValue(listing.serviceArea);
  const seller = `provider #${listing.ownerId}`.toLowerCase();
  const description = normalizeSearchValue(listing.description);
  const primaryText = [title, category, area, seller].join(' ');

  const everyTokenMatchesPrimary = tokens.every((token) => primaryText.includes(token));
  const descriptionContainsFullQuery = description.includes(query);

  if (!everyTokenMatchesPrimary && !descriptionContainsFullQuery) {
    return -1;
  }

  let score = 0;

  if (title === query) score += 300;
  else if (title.startsWith(query)) score += 220;
  else if (title.includes(query)) score += 180;

  if (category === query) score += 170;
  else if (category.startsWith(query)) score += 140;
  else if (category.includes(query)) score += 110;

  if (area === query) score += 160;
  else if (area.startsWith(query)) score += 130;
  else if (area.includes(query)) score += 100;

  if (seller.includes(query)) score += 60;
  if (descriptionContainsFullQuery) score += 35;

  score += tokens.reduce((total, token) => {
    let tokenScore = 0;
    if (title.includes(token)) tokenScore += 24;
    if (category.includes(token)) tokenScore += 20;
    if (area.includes(token)) tokenScore += 18;
    if (seller.includes(token)) tokenScore += 10;
    if (description.includes(token)) tokenScore += 4;
    return total + tokenScore;
  }, 0);

  return score;
}

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
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [campusCoords, setCampusCoords] = useState<Coords | null>(null);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [university, setUniversity] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(null);
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [listingsError, setListingsError] = useState('');
  const isResultsMode = query.trim().length > 0;
  const isDesktopResultsLayout = width >= 1024 && isResultsMode;

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

  useEffect(() => {
    getAllServiceListings()
      .then((response) => setListings(response))
      .catch((err) => setListingsError(err instanceof Error ? err.message : 'Unable to load listings.'))
      .finally(() => setIsListingsLoading(false));
  }, []);

  const results = useMemo(() => {
    const filteredListings = listings.filter((listing) => (
      activeCategory === 'All' || listing.category === activeCategory
    ));

    const normalizedQuery = normalizeSearchValue(query);
    if (!normalizedQuery) {
      return filteredListings;
    }

    return filteredListings
      .map((listing, index) => ({
        listing,
        index,
        score: getSearchScore(listing, normalizedQuery),
      }))
      .filter((entry) => entry.score >= 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return left.index - right.index;
      })
      .map((entry) => entry.listing);
  }, [query, activeCategory, listings]);

  const mapListings = useMemo(() => {
    return results.map((l) => ({
      id: l.id,
      title: l.serviceTitle,
      category: l.category,
      price: l.price,
      priceType: l.priceType,
      area: l.serviceArea,
      seller: `Provider #${l.ownerId}`,
      latitude: l.latitude,
      longitude: l.longitude,
    })).filter((listing): listing is MapListing => (
      typeof listing.latitude === 'number' && Number.isFinite(listing.latitude) &&
      typeof listing.longitude === 'number' && Number.isFinite(listing.longitude)
    ));
  }, [results]);

  const resultCards = useMemo(() => {
    return results.map((listing) => {
      const mappableListing = mapListings.find((mapListing) => mapListing.id === listing.id) ?? null;
      return {
        id: listing.id,
        title: listing.serviceTitle,
        category: listing.category,
        description: listing.description,
        price: listing.price,
        priceType: listing.priceType,
        availability: listing.availability,
        area: listing.serviceArea,
        seller: `Provider #${listing.ownerId}`,
        imageUrl:
          (listing.imageUrls?.[0] ? resolveApiAssetUrl(listing.imageUrls[0]) : '') ||
          'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80',
        mapListing: mappableListing,
      };
    });
  }, [mapListings, results]);

  useEffect(() => {
    if (selectedListing && !mapListings.some((listing) => listing.id === selectedListing.id)) {
      setSelectedListing(null);
    }
  }, [mapListings, selectedListing]);

  useEffect(() => {
    if (!isResultsMode) {
      return;
    }

    if (!selectedListing && mapListings.length > 0) {
      setSelectedListing(mapListings[0]);
    }
  }, [isResultsMode, mapListings, selectedListing]);

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

      </View>
    </View>
  );

  const renderResultCard = (
    card: (typeof resultCards)[number],
    compact = false
  ) => {
    const isSelected = selectedListing?.id === card.id;

    return (
      <TouchableOpacity
        key={card.id}
        style={[
          compact ? styles.mobileResultCard : styles.desktopResultCard,
          compact ? { width: Math.min(width * 0.82, 340) } : null,
          isSelected && styles.resultCardSelected,
        ]}
        activeOpacity={0.9}
        onPress={() => {
          if (card.mapListing) {
            setSelectedListing(card.mapListing);
          }
        }}
      >
        <Image source={{ uri: card.imageUrl }} style={compact ? styles.mobileResultImage : styles.desktopResultImage} />
        <View style={styles.resultCardBody}>
          <View style={styles.resultCardTopRow}>
            <Text style={styles.resultCardTitle} numberOfLines={1}>{card.title}</Text>
            <Text style={styles.resultCardPrice}>${card.price}/{card.priceType}</Text>
          </View>
          <Text style={styles.resultCardMeta}>{card.category}</Text>
          <Text style={styles.resultCardDescription} numberOfLines={compact ? 2 : 3}>
            {card.description}
          </Text>
          <Text style={styles.resultCardFooter} numberOfLines={1}>
            {card.availability}  •  {card.area}
          </Text>
          {!card.mapListing ? (
            <Text style={styles.resultCardWarning}>Map location unavailable for this listing.</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMap = () => (
    <CampusMap
      campusCoords={campusCoords as Coords}
      listings={mapListings}
      selectedListing={selectedListing}
      onSelectListing={setSelectedListing}
    />
  );

  const renderSearchResultsLayout = () => {
    if (isDesktopResultsLayout) {
      return (
        <View style={styles.desktopResultsLayout}>
          <View style={styles.resultsPanel}>
            <View style={styles.resultsPanelHeader}>
              <Text style={styles.resultsPanelTitle}>Results</Text>
              <Text style={styles.resultsPanelSubtitle}>
                {resultCards.length} {resultCards.length === 1 ? 'listing' : 'listings'} for &quot;{query.trim()}&quot;
              </Text>
            </View>
            <ScrollView contentContainerStyle={styles.resultsPanelContent} showsVerticalScrollIndicator={false}>
              {resultCards.length === 0 ? (
                <View style={styles.emptyResultsState}>
                  <Text style={styles.mapPlaceholderTitle}>No matching services</Text>
                  <Text style={styles.mapPlaceholderSubtitle}>Try another keyword or category.</Text>
                </View>
              ) : (
                resultCards.map((card) => renderResultCard(card))
              )}
            </ScrollView>
          </View>
          <View style={styles.desktopMapPanel}>
            {renderMap()}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mobileResultsLayout}>
        <View style={styles.mobileMapPanel}>
          {renderMap()}
          {resultCards.length > 0 ? (
            <View style={styles.mobileResultsTray}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mobileResultsContent}
              >
                {resultCards.map((card) => renderResultCard(card, true))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.mobileEmptyOverlay}>
              <Text style={styles.mapPlaceholderTitle}>No matching services</Text>
              <Text style={styles.mapPlaceholderSubtitle}>Try another keyword or category.</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {renderHeader()}

      {!university ? (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderTitle}>No university set</Text>
          <Text style={styles.mapPlaceholderSubtitle}>Go to Account and add your university to see the campus map.</Text>
        </View>
      ) : isListingsLoading ? (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color={LIGHT_BLUE} />
          <Text style={styles.mapPlaceholderSubtitle}>Loading listings...</Text>
        </View>
      ) : listingsError ? (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderTitle}>Unable to load listings</Text>
          <Text style={styles.mapPlaceholderSubtitle}>{listingsError}</Text>
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
        isResultsMode ? renderSearchResultsLayout() : renderMap()
      )}
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
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: BLACK,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
        boxShadow: 'none',
      },
      default: {},
    }),
  },
  clearBtn: { fontSize: 13, color: '#9CA3AF', fontWeight: '700' },

  controlRow: { flexDirection: 'row', alignItems: 'center' },
  categoryRow: { gap: 8, paddingVertical: 2, flexGrow: 1, alignItems: 'center' },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  catChipActive: { backgroundColor: LIGHT_BLUE, borderColor: LIGHT_BLUE },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  catChipTextActive: { color: WHITE },

  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  mapPlaceholderTitle: { fontSize: 18, fontWeight: '700', color: BLACK },
  mapPlaceholderSubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  desktopResultsLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  resultsPanel: {
    width: 360,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  resultsPanelHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
    gap: 4,
  },
  resultsPanelTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  resultsPanelSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  resultsPanelContent: {
    padding: 12,
    gap: 12,
  },
  desktopMapPanel: {
    flex: 1,
    backgroundColor: '#DFF1FB',
  },
  desktopResultCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  mobileResultsLayout: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mobileMapPanel: {
    flex: 1,
  },
  mobileResultsTray: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
  },
  mobileResultsContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  mobileResultCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  resultCardSelected: {
    borderColor: LIGHT_BLUE,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  desktopResultImage: {
    width: 102,
    height: 102,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  mobileResultImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#E5E7EB',
  },
  resultCardBody: {
    flex: 1,
    paddingTop: 2,
    gap: 4,
  },
  resultCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  resultCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  resultCardPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  resultCardMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  resultCardDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
  },
  resultCardFooter: {
    fontSize: 12,
    color: '#64748B',
  },
  resultCardWarning: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  mobileEmptyOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  emptyResultsState: {
    paddingTop: 24,
    alignItems: 'center',
    gap: 6,
  },

});
