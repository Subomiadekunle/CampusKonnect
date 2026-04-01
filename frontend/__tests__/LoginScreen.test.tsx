import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/(tabs)/login';
import * as authLib from '@/lib/auth';

// ─── Test Case 1: Non-.edu Email Rejected ───────────────────────────────────

describe('LoginScreen — email validation', () => {
  it('shows error when a non-.edu address is entered and blurred', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('Enter your school email');
    fireEvent.changeText(emailInput, 'user@gmail.com');
    fireEvent(emailInput, 'blur');

    await waitFor(() => {
      expect(getByText('Please sign up with your school email')).toBeTruthy();
    });
  });

  it('clears the error when a valid .edu address is entered', async () => {
    const { getByPlaceholderText, queryByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('Enter your school email');
    fireEvent.changeText(emailInput, 'user@gmail.com');
    fireEvent(emailInput, 'blur');
    fireEvent.changeText(emailInput, 'user@slu.edu');

    await waitFor(() => {
      expect(queryByText('Please sign up with your school email')).toBeNull();
    });
  });
});

// ─── Test Case 2: API Error Message Displayed ────────────────────────────────

describe('LoginScreen — API error handling', () => {
  it('displays the backend error message on failed login', async () => {
    jest.spyOn(authLib, 'loginUser').mockRejectedValue(
      new Error('Invalid password')
    );

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(
      getByPlaceholderText('Enter your school email'),
      'student@slu.edu'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter your password'),
      'wrongpass'
    );
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Invalid password')).toBeTruthy();
    });
  });

  it('shows fallback message when error is not an Error instance', async () => {
    jest.spyOn(authLib, 'loginUser').mockRejectedValue('unexpected');

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(
      getByPlaceholderText('Enter your school email'),
      'student@slu.edu'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter your password'),
      'pass'
    );
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Unable to sign in right now.')).toBeTruthy();
    });
  });
});
