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

export type VerifyEmailResponse = {
  message: string;
};

const API_BASE_URL = 'http://localhost:8080';

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
export async function registerUser(body: RegisterRequest): Promise<AuthResponse> {
  const data = await postJson<AuthResponse>('/auth/register', body, 'Registration failed.');

  return {
    // `token` currently carries the backend success message for registration.
    token: data.token ?? 'Registration worked. Check your email for verification instructions.',
  };
}

export async function verifyEmail(body: VerifyEmailRequest): Promise<VerifyEmailResponse> {
  const params = new URLSearchParams({
    email: body.email.trim().toLowerCase(),
    code: body.code.trim(),
  });

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/verify?${params.toString()}`);

    if (typeof response.data !== 'string' || !response.data) {
      throw new Error('Verification failed.');
    }

    return {
      message: response.data,
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const backendMessage = err.response?.data?.message || err.response?.data?.error;

      const errorMessage = backendMessage || 'Verification failed.';
      throw new Error(errorMessage);
    }

    throw new Error('Verification failed.');
  }
}
