import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { saveUserPreferences } from '@/lib/auth';
<<<<<<< HEAD

const CATEGORIES: { label: string; emoji: string }[] = [
  { label: 'Nails', emoji: '💅' },
  { label: 'Photography', emoji: '📷' },
  { label: 'Headshots', emoji: '🤳' },
  { label: 'Hair Braiding', emoji: '💇' },
  { label: 'Makeup', emoji: '💄' },
  { label: 'Tutoring', emoji: '📚' },
  { label: 'Graphic Design', emoji: '🎨' },
  { label: 'Video Editing', emoji: '🎬' },
  { label: 'Music Production', emoji: '🎵' },
  { label: 'DJing', emoji: '🎧' },
  { label: 'Personal Training', emoji: '💪' },
  { label: 'Catering', emoji: '🍽️' },
  { label: 'Cleaning', emoji: '🧹' },
  { label: 'Fashion / Alterations', emoji: '✂️' },
  { label: 'Tech Support', emoji: '💻' },
  { label: 'Baking & Sweets', emoji: '🧁' },
  { label: 'Event Planning', emoji: '🎉' },
  { label: 'Locs & Twists', emoji: '🌀' },
  { label: 'Jewelry Making', emoji: '💎' },
  { label: 'Painting & Art', emoji: '🖌️' },
];
=======
import { SERVICE_CATEGORIES } from '@/constants/service-categories';

const CATEGORIES: { label: string; emoji: string }[] = SERVICE_CATEGORIES.map((category) => ({
  label: category,
  emoji: '✨',
}));
>>>>>>> fda74ba070091679cd9d10c2bc5f3f94a72855f0

export default function PreferencesScreen() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggle = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    setError('');
    try {
      setIsSubmitting(true);
      await saveUserPreferences(Array.from(selected));
      router.replace('/');
    } catch {
      setError('Unable to save preferences. You can update them later in your account.');
      router.replace('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>CK</Text>
          </View>
          <Text style={styles.title}>What are you into?</Text>
          <Text style={styles.subtitle}>
<<<<<<< HEAD
            Pick the services you're interested in. We'll personalize your feed.
=======
            Pick the services you&apos;re interested in. We&apos;ll personalize your feed.
>>>>>>> fda74ba070091679cd9d10c2bc5f3f94a72855f0
          </Text>
        </View>

        <View style={styles.grid}>
          {CATEGORIES.map(({ label, emoji }) => {
            const isSelected = selected.has(label);
            return (
              <TouchableOpacity
                key={label}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggle(label)}
                activeOpacity={0.75}>
                <Text style={styles.chipEmoji}>{emoji}</Text>
                <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.footer}>
          <Text style={styles.selectedCount}>
            {selected.size > 0 ? `${selected.size} selected` : 'Select at least one to get started'}
          </Text>
          <TouchableOpacity
            style={[styles.continueButton, selected.size === 0 && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>
                {selected.size === 0 ? 'Skip for now' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const LIGHT_BLUE = '#4FC3F7';
const BLACK = '#0D0D0D';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 28,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LIGHT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: LIGHT_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: BLACK,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#607D8B',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#D6EAF8',
    backgroundColor: '#F8FCFF',
  },
  chipSelected: {
    backgroundColor: LIGHT_BLUE,
    borderColor: LIGHT_BLUE,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  chipLabelSelected: {
    color: WHITE,
  },
  footer: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
  },
  selectedCount: {
    fontSize: 13,
    color: '#607D8B',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    width: '100%',
    shadowColor: LIGHT_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: '#B0BEC5',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 13,
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 12,
  },
});
