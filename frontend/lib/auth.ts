import axios from 'axios';

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
  preferences: string[];
  university: string | null;
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
  images?: ListingImageUpload[];
};

const API_BASE_URL = 'http://localhost:8080';
const AUTH_TOKEN_STORAGE_KEY = 'campuskonnect-auth-token';

// Set to true to bypass the backend for local UI development
const MOCK_MODE = true;

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
        err.response?.data?.message || err.response?.data?.error || fallbackError;
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
        err.response?.data?.message || err.response?.data?.error || fallbackError;
      throw new Error(errorMessage);
    }

    throw new Error(fallbackError);
  }
}

// Keep auth requests in one place so screens can stay focused on UI and validation.
export async function registerUser(body: RegisterRequest): Promise<RegistrationResponse> {
  if (MOCK_MODE) return { message: 'Registration successful. Please verify your email.' };
  return postJson<RegistrationResponse>('/auth/register', body, 'Registration failed.');
}

export async function loginUser(body: LoginRequest): Promise<AuthResponse> {
  if (MOCK_MODE) {
    const token = 'mock-jwt-token';
    await persistAuthToken(token);
    return { token };
  }
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

const MOCK_PREFERENCES_KEY = 'campuskonnect-mock-preferences';
const MOCK_UNIVERSITY_KEY = 'campuskonnect-mock-university';
const USER_LOCATION_KEY = 'campuskonnect-user-location';

export function getUserLocation(): string {
  return storage?.getItem(USER_LOCATION_KEY) ?? '';
}

export function saveUserLocation(location: string): void {
  storage?.setItem(USER_LOCATION_KEY, location);
}

export async function getCurrentUser(): Promise<UserProfile> {
  if (MOCK_MODE) {
    const stored = storage?.getItem(MOCK_PREFERENCES_KEY);
    const preferences: string[] = stored ? JSON.parse(stored) : [];
    const university = storage?.getItem(MOCK_UNIVERSITY_KEY) ?? null;
    return { name: 'Test User', email: 'test@slu.edu', preferences, university };
  }
  return getJson<UserProfile>('/api/users/me', 'Unable to load profile.');
}

export async function saveUniversity(university: string): Promise<UserProfile> {
  if (MOCK_MODE) {
    storage?.setItem(MOCK_UNIVERSITY_KEY, university);
    const stored = storage?.getItem(MOCK_PREFERENCES_KEY);
    const preferences: string[] = stored ? JSON.parse(stored) : [];
    return { name: 'Test User', email: 'test@slu.edu', preferences, university };
  }
  try {
    const response = await axios.put(`${API_BASE_URL}/api/users/university`, { university });
    return response.data as UserProfile;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || err.response?.data?.error || 'Unable to save university.');
    }
    throw new Error('Unable to save university.');
  }
}

export async function saveUserPreferences(preferences: string[]): Promise<UserProfile> {
  if (MOCK_MODE) {
    storage?.setItem(MOCK_PREFERENCES_KEY, JSON.stringify(preferences));
    const university = storage?.getItem(MOCK_UNIVERSITY_KEY) ?? null;
    return { name: 'Test User', email: 'test@slu.edu', preferences, university };
  }
  try {
    const response = await axios.put(`${API_BASE_URL}/api/users/preferences`, preferences);
    return response.data as UserProfile;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const errorMessage =
        err.response?.data?.message || err.response?.data?.error || 'Unable to save preferences.';
      throw new Error(errorMessage);
    }
    throw new Error('Unable to save preferences.');
  }
}

export async function verifyEmail(body: VerifyEmailRequest): Promise<AuthResponse> {
  if (MOCK_MODE) {
    const token = 'mock-jwt-token';
    await persistAuthToken(token);
    return { token };
  }
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
    })
  );

  (body.images ?? []).forEach((image, index) => {
    formData.append('images', {
      uri: image.uri,
      name: image.name || `listing-image-${index + 1}.jpg`,
      type: image.type || 'image/jpeg',
    } as any);
  });

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
  if (MOCK_MODE) return [];
  return getJson<ServiceListing[]>('/api/listings', 'Unable to load listings.');
}

export async function getMyServiceListings(): Promise<ServiceListing[]> {
  if (MOCK_MODE) return [];
  return getJson<ServiceListing[]>('/api/listings/mine', 'Unable to load your listings.');
}
