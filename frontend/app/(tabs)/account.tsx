import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { clearAuthToken, getCurrentUser, saveUniversity, UserProfile } from '@/lib/auth';

export default function AccountScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [universityModalVisible, setUniversityModalVisible] = useState(false);
  const [universityInput, setUniversityInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    getCurrentUser()
      .then(setProfile)
      .catch(() => setError('Unable to load profile.'))
      .finally(() => setIsLoading(false));
  }, []);

  const openUniversityModal = () => {
    setUniversityInput(profile?.university ?? '');
    setUniversityModalVisible(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const closeUniversityModal = () => {
    Animated.timing(slideAnim, { toValue: 400, useNativeDriver: true, duration: 200 }).start(() =>
      setUniversityModalVisible(false)
    );
  };

  const handleSaveUniversity = async () => {
    const trimmed = universityInput.trim();
    if (!trimmed) return;
    try {
      setIsSaving(true);
      const updated = await saveUniversity(trimmed);
      setProfile(updated);
      closeUniversityModal();
    } catch {
      // silently fail — user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await clearAuthToken();
    router.replace('/login');
  };

  const initials = profile?.name
    ? profile.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const username = profile?.email ? profile.email.split('@')[0] : '';

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={LIGHT_BLUE} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{profile?.name}</Text>
          <Text style={styles.usernameText}>@{username}</Text>
          {profile?.university ? (
            <Text style={styles.universityBadge}>{profile.university}</Text>
          ) : null}
        </View>

        {/* Account info card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full name</Text>
            <Text style={styles.infoValue}>{profile?.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>@{username}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email}</Text>
          </View>
        </View>

        {/* University card */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>University</Text>
            <TouchableOpacity onPress={openUniversityModal}>
              <Text style={styles.editLink}>{profile?.university ? 'Change' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
          {profile?.university ? (
            <Text style={styles.universityValue}>{profile.university}</Text>
          ) : (
            <TouchableOpacity onPress={openUniversityModal}>
              <Text style={styles.emptyValue}>Add your university to see your campus on the map</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Interests card */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>My Interests</Text>
            <TouchableOpacity onPress={() => router.push('/preferences')}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          {profile?.preferences && profile.preferences.length > 0 ? (
            <View style={styles.preferencesGrid}>
              {profile.preferences.map((pref) => (
                <View key={pref} style={styles.prefChip}>
                  <Text style={styles.prefChipText}>{pref}</Text>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity onPress={() => router.push('/preferences')}>
              <Text style={styles.emptyValue}>No interests selected yet. Tap to add some.</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* University modal */}
      <Modal visible={universityModalVisible} transparent animationType="none" onRequestClose={closeUniversityModal}>
        <Pressable style={styles.modalOverlay} onPress={closeUniversityModal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKAV}>
            <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
              <Pressable>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Your University</Text>
                <Text style={styles.modalSubtitle}>
                  Enter your university name to see your campus on the map and connect with students near you.
                </Text>
                <TextInput
                  ref={inputRef}
                  style={styles.universityInput}
                  placeholder="e.g. Saint Louis University"
                  placeholderTextColor="#9CA3AF"
                  value={universityInput}
                  onChangeText={setUniversityInput}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveUniversity}
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.saveButton, (!universityInput.trim() || isSaving) && styles.saveButtonDisabled]}
                  onPress={handleSaveUniversity}
                  disabled={!universityInput.trim() || isSaving}>
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save University</Text>
                  )}
                </TouchableOpacity>
              </Pressable>
            </Animated.View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const LIGHT_BLUE = '#4FC3F7';
const BLACK = '#0D0D0D';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 48 },

  profileHeader: { alignItems: 'center', paddingTop: 56, paddingBottom: 28, gap: 4 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: LIGHT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: LIGHT_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: WHITE, letterSpacing: 1 },
  displayName: { fontSize: 22, fontWeight: '700', color: BLACK },
  usernameText: { fontSize: 14, color: '#607D8B', fontWeight: '500' },
  universityBadge: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },

  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F4FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: BLACK, marginBottom: 16 },
  editLink: { fontSize: 13, color: LIGHT_BLUE, fontWeight: '600', marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  infoLabel: { fontSize: 14, color: '#607D8B', fontWeight: '500' },
  infoValue: { fontSize: 14, color: BLACK, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#EEF2F7', marginVertical: 10 },
  universityValue: { fontSize: 15, fontWeight: '600', color: BLACK },
  emptyValue: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },
  preferencesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prefChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: '#E8F4FD' },
  prefChipText: { fontSize: 13, fontWeight: '600', color: '#1976D2' },

  logoutButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E53935',
    backgroundColor: WHITE,
    marginTop: 8,
  },
  logoutButtonText: { fontSize: 16, fontWeight: '700', color: '#E53935' },
  errorText: { fontSize: 15, color: '#E53935' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalKAV: { justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: BLACK, marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: '#607D8B', marginBottom: 20, lineHeight: 20 },
  universityInput: {
    borderWidth: 1.5,
    borderColor: '#D6EAF8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: BLACK,
    backgroundColor: '#F8FCFF',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: LIGHT_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: { backgroundColor: '#B0BEC5', shadowOpacity: 0, elevation: 0 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: WHITE },
});
