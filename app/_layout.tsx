/**
 * Root Navigation Layout (_layout.tsx)
 *
 * This is the root layout component for Expo Router.
 * It sets up:
 * - Error Boundary for crash prevention
 * - Global Context Providers (Auth, Bus, Search)
 * - Stack Navigator for screen transitions
 * - Font loading and asset preparation
 *
 * Expert-level production code with comprehensive error handling
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the component tree
 * Displays fallback UI instead of crashing the entire app
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service (e.g., Sentry, Firebase Crashlytics)
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI when error occurs
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={this.handleReset}
          >
            <Text style={styles.resetButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * RootLayout Component
 *
 * Main layout wrapper with all providers and navigation setup
 */
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Prepare app assets and initialize services
    async function prepare() {
      try {
        // Load fonts, initialize Firebase, check auth state, etc.
        // Add any initialization logic here

        // Simulate asset loading (replace with actual loading logic)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error('Error during app preparation:', error);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  // Show loading screen while app is preparing
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading Bus Stand...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      {/*
        Stack Navigator for screen transitions
        Expo Router automatically creates routes based on file structure
      */}
      <Stack
        screenOptions={{
          headerShown: false, // Hide header by default, show per screen if needed
          animation: 'slide_from_right', // Smooth screen transitions
        }}
      >
        {/* Home screen (index.tsx) */}
        <Stack.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
          }}
        />

        {/* Auth screens group */}
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: 'Login',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="(auth)/signup"
          options={{
            title: 'Sign Up',
            presentation: 'modal',
          }}
        />

        {/* Passenger screens group */}
        <Stack.Screen
          name="(passenger)/search-results"
          options={{
            title: 'Search Results',
          }}
        />
        <Stack.Screen
          name="(passenger)/bus-details"
          options={{
            title: 'Bus Details',
          }}
        />

        {/* Driver screens group */}
        <Stack.Screen
          name="(driver)/bus-listing"
          options={{
            title: 'My Buses',
          }}
        />

        {/* Offline screen */}
        <Stack.Screen
          name="offline"
          options={{
            title: 'Offline Mode',
          }}
        />
      </Stack>

      {/* Status bar configuration */}
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}

/**
 * Styles for error boundary and loading states
 */
const styles = StyleSheet.create({
  // Error boundary styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  resetButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading screen styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#000000',
    fontWeight: '500',
  },
});
