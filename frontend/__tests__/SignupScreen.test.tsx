import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignUpScreen from '@/app/(tabs)/signup';
import * as authLib from '@/lib/auth';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

describe('SignupScreen — email validation', () => {
  it('shows error when a non-.edu email is entered and blurred', async () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    const emailInput = getByPlaceholderText('Enter your school email');
    fireEvent.changeText(emailInput, 'user@gmail.com');
    fireEvent(emailInput, 'blur');

    await waitFor(() => {
      expect(getByText('Please sign up with your school email')).toBeTruthy();
    });
  });

  it('shows passwords do not match error', async () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('Enter your school email'), 'test@slu.edu');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'different123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('Passwords do not match.')).toBeTruthy();
    });
  });
});

describe('SignupScreen — API error handling', () => {
  beforeEach(() => jest.clearAllMocks());

  it('displays the backend error message on failed registration', async () => {
    jest.spyOn(authLib, 'registerUser').mockRejectedValue(new Error('Email already in use'));

    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('Enter your school email'), 'test@slu.edu');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('Email already in use')).toBeTruthy();
    });
  });
});
