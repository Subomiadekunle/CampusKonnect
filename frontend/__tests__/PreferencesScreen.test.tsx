import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PreferencesScreen from '@/app/(tabs)/preferences';
import * as authLib from '@/lib/auth';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

describe('PreferencesScreen — category selection', () => {
  it('selects a category chip on press', () => {
    const { getByText } = render(<PreferencesScreen />);
    fireEvent.press(getByText('Tutoring'));
    expect(getByText('1 selected')).toBeTruthy();
  });

  it('deselects a chip when pressed again', () => {
    const { getByText } = render(<PreferencesScreen />);
    fireEvent.press(getByText('Tutoring'));
    fireEvent.press(getByText('Tutoring'));
    expect(getByText('Select at least one to get started')).toBeTruthy();
  });
});

describe('PreferencesScreen — submission', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls saveUserPreferences with the selected categories', async () => {
    const saveSpy = jest
      .spyOn(authLib, 'saveUserPreferences')
      .mockResolvedValue(undefined);

    const { getByText } = render(<PreferencesScreen />);
    fireEvent.press(getByText('Tutoring'));
    fireEvent.press(getByText('Photography'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith(
        expect.arrayContaining(['Tutoring', 'Photography'])
      );
    });
  });

  it('redirects home even when saveUserPreferences fails', async () => {
    jest.spyOn(authLib, 'saveUserPreferences').mockRejectedValue(new Error('Network error'));
    const { router } = require('expo-router');

    const { getByText } = render(<PreferencesScreen />);
    fireEvent.press(getByText('Tutoring'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });
});
