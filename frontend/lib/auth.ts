import axios from 'axios';
import { Platform } from 'react-native';

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type VerifyEmailRequest = {
  email: string;
  code: string;
};

export type AuthResponse = {
  token: string;
};

export type RegistrationResponse = {
  message: string;
};

export type UserProfile = {
  name: string;
  email: string;
  preferences?: string[];
  university?: string | null;
};

export type ServiceListing = {
  id: number;
  ownerId: number;
  serviceTitle: string;
  category: string;
  description: string;
  price: string;
  priceType: string;
  availability: string;
  serviceArea: string;
  latitude: number | null;
  longitude: number | null;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
};

export type ListingImageUpload = {
  uri: string;
  name: string;
  type: string;
};

export type CreateServiceListingRequest = {
  serviceTitle: string;
  category: string;
  description: string;
  price: string;
  priceType: string;
  availability: string;
  serviceArea: string;
  latitude?: number;
  longitude?: number;
  images?: ListingImageUpload[];
};

export type ImproveListingDescriptionRequest = {
  description: string;
  serviceType?: string;
  location?: string;
  tone?: string;
};

export type ImproveListingDescriptionResponse = {
  improvedDescription: string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  (Platform.OS === 'web' ? '' : 'http://localhost:8080');
const AUTH_TOKEN_STORAGE_KEY = 'campuskonnect-auth-token';

let authToken: string | null = null;

function getWebStorage(): Storage | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

function applyAuthToken(token: string | null) {
  authToken = token;

  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete axios.defaults.headers.common.Authorization;
}

const storage = getWebStorage();
const storedToken = storage?.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null;
if (storedToken) {
  applyAuthToken(storedToken);
}

async function postJson<TResponse>(path: string, body: unknown, fallbackError: string): Promise<TResponse> {
  try {
    const response = await axios.post(`${API_BASE_URL}${path}`, body);
    return response.data as TResponse;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.title ||
        fallbackError;
      throw new Error(errorMessage);
    }

    throw new Error(fallbackError);
  }
}

async function getJson<TResponse>(path: string, fallbackError: string): Promise<TResponse> {
  try {
    const response = await axios.get(`${API_BASE_URL}${path}`);
    return response.data as TResponse;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.title ||
        fallbackError;
      throw new Error(errorMessage);
    }

    throw new Error(fallbackError);
  }
}

// Keep auth requests in one place so screens can stay focused on UI and validation.
export async function registerUser(body: RegisterRequest): Promise<RegistrationResponse> {
  return postJson<RegistrationResponse>('/auth/register', body, 'Registration failed.');
}

export async function loginUser(body: LoginRequest): Promise<AuthResponse> {
  return postJson<AuthResponse>('/auth/login', body, 'Login failed.');
}

export async function persistAuthToken(token: string): Promise<void> {
  applyAuthToken(token);
  storage?.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  return authToken;
}

export async function clearAuthToken(): Promise<void> {
  applyAuthToken(null);
  storage?.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export async function getCurrentUser(): Promise<UserProfile> {
  return getJson<UserProfile>('/api/users/me', 'Unable to load profile.');
}

export async function saveUserPreferences(preferences: string[]): Promise<UserProfile> {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/users/preferences`, preferences, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data as UserProfile;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.title ||
        'Unable to save preferences.';
      throw new Error(errorMessage);
    }
    throw new Error('Unable to save preferences.');
  }
}

export async function saveUniversity(university: string): Promise<UserProfile> {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/users/university`,
      { university },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data as UserProfile;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.title ||
        'Unable to save university.';
      throw new Error(errorMessage);
    }
    throw new Error('Unable to save university.');
  }
}

export async function verifyEmail(body: VerifyEmailRequest): Promise<AuthResponse> {
  const params = new URLSearchParams({
    email: body.email.trim().toLowerCase(),
    code: body.code.trim(),
  });

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/verify?${params.toString()}`);
    return response.data as AuthResponse;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const backendMessage = err.response?.data?.message || err.response?.data?.error;

      const errorMessage = backendMessage || 'Verification failed.';
      throw new Error(errorMessage);
    }

    throw new Error('Verification failed.');
  }
}

export async function createServiceListing(
  body: CreateServiceListingRequest
): Promise<ServiceListing> {
  const formData = new FormData();
  formData.append(
    'listing',
    JSON.stringify({
      serviceTitle: body.serviceTitle,
      category: body.category,
      description: body.description,
      price: body.price,
      priceType: body.priceType,
      availability: body.availability,
      serviceArea: body.serviceArea,
      latitude: body.latitude,
      longitude: body.longitude,
    })
  );

  for (const [index, image] of (body.images ?? []).entries()) {
    const fileName = image.name || `listing-image-${index + 1}.jpg`;
    const fileType = image.type || 'image/jpeg';

    if (Platform.OS === 'web') {
      const blobResponse = await fetch(image.uri);
      const blob = await blobResponse.blob();
      (formData as any).append('images', blob, fileName);
    } else {
      formData.append('images', {
        uri: image.uri,
        name: fileName,
        type: fileType,
      } as any);
    }
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/api/listings`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as ServiceListing;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const errorMessage =
        err.response?.data?.message || err.response?.data?.error || 'Unable to create listing.';
      throw new Error(errorMessage);
    }
    throw new Error('Unable to create listing.');
  }
}

export async function getAllServiceListings(): Promise<ServiceListing[]> {
  return getJson<ServiceListing[]>('/api/listings', 'Unable to load listings.');
}

export function resolveApiAssetUrl(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `${API_BASE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

export async function getMyServiceListings(): Promise<ServiceListing[]> {
  return getJson<ServiceListing[]>('/api/listings/mine', 'Unable to load your listings.');
}

export async function improveServiceListingDescription(
  body: ImproveListingDescriptionRequest
): Promise<ImproveListingDescriptionResponse> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/listings/ai-description`, body, {
      timeout: 25000,
    });
    return response.data as ImproveListingDescriptionResponse;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.code === 'ECONNABORTED') {
        throw new Error('AI request timed out. Please try again in a moment.');
      }
      if (err.response?.status === 504) {
        throw new Error('AI service timed out. Please try again in a few seconds.');
      }
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.title ||
        'Unable to improve description right now.';
      throw new Error(errorMessage);
    }
    throw new Error('Unable to improve description right now.');
  }
}
