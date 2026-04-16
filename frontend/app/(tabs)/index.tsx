import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getAllServiceListings, ServiceListing } from '@/lib/auth';

export default function HomeScreen() {
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadListings = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage('');

      const response = await getAllServiceListings();
      setListings(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load listings.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => loadListings(true)} />
      }
    >
      <Text style={styles.title}>Listings Around You</Text>
      <Text style={styles.subtitle}>
        Browse available student services near campus. Use the Create tab to publish your own listing.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nearby Listings</Text>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {isLoading ? (
          <ActivityIndicator color="#0288D1" />
        ) : listings.length === 0 ? (
          <Text style={styles.emptyText}>No listings found yet.</Text>
        ) : (
          listings.map((listing) => (
            <View style={styles.listingCard} key={listing.id}>
              {listing.imageUrls?.length ? (
                <Image
                  source={{ uri: `http://localhost:8080${listing.imageUrls[0]}` }}
                  style={styles.listingImage}
                />
              ) : null}
              <Text style={styles.listingTitle}>{listing.serviceTitle}</Text>
              <Text style={styles.listingMeta}>
                {listing.category} • ${listing.price}/{listing.priceType}
              </Text>
              <Text style={styles.listingLabel}>Description</Text>
              <Text style={styles.listingValue}>{listing.description}</Text>
              <Text style={styles.listingLabel}>Service Area</Text>
              <Text style={styles.listingValue}>{listing.serviceArea}</Text>
              <Text style={styles.listingLabel}>Availability</Text>
              <Text style={styles.listingValue}>{listing.availability}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F6FBFF',
    paddingBottom: 40,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  subtitle: {
    fontSize: 14,
    color: '#546E7A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D6EAF8',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  listingCard: {
    borderWidth: 1,
    borderColor: '#E3F2FD',
    borderRadius: 10,
    padding: 10,
    gap: 4,
    backgroundColor: '#FAFDFF',
  },
  listingImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#E5E7EB',
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  listingMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 4,
  },
  listingLabel: {
    fontSize: 12,
    color: '#607D8B',
    fontWeight: '600',
  },
  listingValue: {
    fontSize: 14,
    color: '#102027',
    marginBottom: 4,
  },
  emptyText: {
    color: '#607D8B',
  },
  errorText: {
    color: '#B71C1C',
    fontWeight: '600',
  },
});
