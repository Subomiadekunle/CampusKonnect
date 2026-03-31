import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { persistAuthToken, verifyEmail } from '@/lib/auth';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (value: string) => {
    if (value && !value.toLowerCase().endsWith('.edu')) {
      setEmailError('Please enter your school email');
    } else {
      setEmailError('');
    }
  };

  const handleVerify = async () => {
    setFormError('');
    setSuccessMessage('');

    if (!email.trim() || !code.trim()) {
      setFormError('Please enter both your email and verification code.');
      return;
    }

    if (!email.toLowerCase().endsWith('.edu')) {
      setEmailError('Please enter your school email');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await verifyEmail({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      });

      await persistAuthToken(response.token);
      setSuccessMessage('Email verified successfully.');
      router.replace('/');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to verify code right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>CK</Text>
            </View>
            <Text style={styles.appName}>CampusKonnect</Text>
            <Text style={styles.tagline}>Verify your student account</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enter verification code</Text>
            <Text style={styles.cardSubtitle}>
              We sent a code to your school email after registration.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Enter your school email"
                placeholderTextColor="#A0AEB8"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (emailError) validateEmail(value);
                }}
                onBlur={() => validateEmail(email)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter the 6-digit code"
                placeholderTextColor="#A0AEB8"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={6}
              />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleVerify}>
              {isSubmitting ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <Text style={styles.primaryButtonText}>Verify Email</Text>
              )}
            </TouchableOpacity>

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
          </View>

          <View style={styles.bottomPad} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const LIGHT_BLUE = '#4FC3F7';
const BLACK = '#0D0D0D';
const WHITE = '#FFFFFF';
const BORDER = '#D6EAF8';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  inner: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 56,
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: BLACK,
    fontWeight: '600',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: LIGHT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: LIGHT_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 1,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#607D8B',
    marginTop: 4,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: BLACK,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#607D8B',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: BLACK,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: BLACK,
    backgroundColor: '#F8FCFF',
  },
  inputError: {
    borderColor: '#E53935',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    fontSize: 12,
    color: '#E53935',
    marginTop: 6,
    fontWeight: '500',
  },
  successText: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 6,
    fontWeight: '500',
  },
  primaryButton: {
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
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.5,
  },
  bottomPad: {
    height: 16,
  },
});
