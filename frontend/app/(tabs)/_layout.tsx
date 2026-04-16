import { Tabs, router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { clearAuthToken, getAuthToken, getCurrentUser } from '@/lib/auth';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const authRoutes = new Set(['/login', '/signup', '/verify']);

    async function guardProtectedRoutes() {
      let token = await getAuthToken();
      const isOnAuthRoute = authRoutes.has(pathname);

      // If a token exists, confirm it still works (not expired/invalid).
      if (token && !isOnAuthRoute) {
        try {
          await getCurrentUser();
        } catch {
          await clearAuthToken();
          token = null;
        }
      }

      if (!token && !isOnAuthRoute) {
        router.replace('/login');
      }

      if (token && isOnAuthRoute) {
        router.replace('/');
      }

      setIsAuthChecked(true);
    }

    guardProtectedRoutes();
  }, [pathname]);

  if (!isAuthChecked) {
    return null;
  }

  return (
    <Tabs
      initialRouteName="login"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      {/* Auth screens — hidden from tab bar */}
      <Tabs.Screen
        name="login"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="signup"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="verify"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

      {/* App tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="magnifyingglass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <Pressable
              {...props}
              style={({ pressed }) => [
                styles.createTabButton,
                pressed && styles.createTabButtonPressed,
              ]}
            >
              <View style={styles.createTabInner}>
                <Text style={styles.createTabPlus}>+</Text>
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 74,
    paddingBottom: 10,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  createTabButton: {
    top: -14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createTabButtonPressed: {
    opacity: 0.85,
  },
  createTabInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  createTabPlus: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 34,
    marginTop: -2,
  },
});
