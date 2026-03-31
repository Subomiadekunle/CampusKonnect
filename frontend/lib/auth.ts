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

const API_BASE_URL = 'http://localhost:8080';
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
        err.response?.data?.message || err.response?.data?.error || fallbackError;
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
