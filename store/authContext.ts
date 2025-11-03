/**
 * Authentication Context
 *
 * Expert-level authentication state management with:
 * - User authentication state
 * - Login/logout functionality
 * - User type management
 * - Persistent auth state
 * - Error handling
 *
 * Created by Senior React Native Developer (10+ years experience)
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import firebaseService from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * User Interface
 */
interface User {
  uid: string;
  email: string;
  name: string;
  phoneNumber: string;
  userType: 'passenger' | 'driver';
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Auth State Interface
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

/**
 * Auth Action Types
 */
type AuthAction =
  | { type: 'AUTH_START_LOADING' }
  | { type: 'AUTH_STOP_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_INITIALIZED' };

/**
 * Auth Context Interface
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    phoneNumber: string,
    userType: 'passenger' | 'driver'
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Initial auth state
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

/**
 * Auth reducer
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_STOP_LOADING':
      return {
        ...state,
        isLoading: false,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'AUTH_INITIALIZED':
      return {
        ...state,
        isInitialized: true,
        isLoading: false,
      };

    default:
      return state;
  }
};

/**
 * Create auth context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize authentication
   */
  const initializeAuth = async () => {
    try {
      dispatch({ type: 'AUTH_START_LOADING' });

      // Check if user is already authenticated
      const currentUser = firebaseService.getCurrentUser();
      if (currentUser) {
        // Get user data from Firestore
        const userDataResult = await firebaseService.getCurrentUserData();
        if (userDataResult.success && userDataResult.user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: userDataResult.user });
        } else {
          // User exists in auth but not in Firestore, log them out
          await firebaseService.signOut();
          dispatch({ type: 'AUTH_INITIALIZED' });
        }
      } else {
        // Try to restore from AsyncStorage
        const savedUserData = await AsyncStorage.getItem('userData');
        if (savedUserData) {
          const userData = JSON.parse(savedUserData);
          // Verify user is still valid by checking current auth state
          const currentUser = firebaseService.getCurrentUser();
          if (currentUser && currentUser.uid === userData.uid) {
            dispatch({ type: 'AUTH_SUCCESS', payload: userData });
          } else {
            // Clear invalid saved data
            await AsyncStorage.removeItem('userData');
          }
        }
        dispatch({ type: 'AUTH_INITIALIZED' });
      }

    } catch (error) {
      console.error('❌ Failed to initialize auth:', error);
      dispatch({ type: 'AUTH_INITIALIZED' });
    }
  };

  /**
   * Login user
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'AUTH_START_LOADING' });

      const result = await firebaseService.signIn(email, password);

      if (result.success && result.user) {
        // Save user data to AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(result.user));

        dispatch({ type: 'AUTH_SUCCESS', payload: result.user });
        console.log('✅ User logged in successfully');
        return { success: true };
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: result.error || 'Login failed' });
        return { success: false, error: result.error };
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Sign up new user
   */
  const signUp = async (
    email: string,
    password: string,
    name: string,
    phoneNumber: string,
    userType: 'passenger' | 'driver'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'AUTH_START_LOADING' });

      const result = await firebaseService.signUp(email, password, name, phoneNumber, userType);

      if (result.success && result.user) {
        // Save user data to AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(result.user));

        dispatch({ type: 'AUTH_SUCCESS', payload: result.user });
        console.log('✅ User signed up successfully');
        return { success: true };
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: result.error || 'Sign up failed' });
        return { success: false, error: result.error };
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Sign up failed. Please try again.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      await firebaseService.signOut();
      await AsyncStorage.removeItem('userData');
      dispatch({ type: 'AUTH_LOGOUT' });
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Failed to logout:', error);
      // Even if logout fails, clear local state
      await AsyncStorage.removeItem('userData');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  /**
   * Clear error
   */
  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  /**
   * Update user profile
   */
  const updateUserProfile = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!state.user) {
        return { success: false, error: 'No user logged in' };
      }

      const result = await firebaseService.updateUserProfile(state.user.uid, updates);

      if (result.success) {
        // Update local state
        const updatedUser = { ...state.user, ...updates };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        dispatch({ type: 'AUTH_SUCCESS', payload: updatedUser });
        console.log('✅ User profile updated successfully');
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update profile. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Listen to auth state changes
   */
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChanged(async (user) => {
      if (user) {
        // User is authenticated, get full user data
        const userDataResult = await firebaseService.getCurrentUserData();
        if (userDataResult.success && userDataResult.user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: userDataResult.user });
          await AsyncStorage.setItem('userData', JSON.stringify(userDataResult.user));
        }
      } else {
        // User is not authenticated
        dispatch({ type: 'AUTH_LOGOUT' });
        await AsyncStorage.removeItem('userData');
      }
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    isInitialized: state.isInitialized,
    login,
    signUp,
    logout,
    clearError,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook to get current user
 */
export const useCurrentUser = (): User | null => {
  const { user } = useAuth();
  return user;
};

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * Hook to check if user is driver
 */
export const useIsDriver = (): boolean => {
  const { user } = useAuth();
  return user?.userType === 'driver';
};

/**
 * Hook to check if user is passenger
 */
export const useIsPassenger = (): boolean => {
  const { user } = useAuth();
  return user?.userType === 'passenger';
};

/**
 * Hook to get auth loading state
 */
export const useAuthLoading = (): boolean => {
  const { isLoading, isInitialized } = useAuth();
  return isLoading || !isInitialized;
};

/**
 * Hook to get auth error
 */
export const useAuthError = (): string | null => {
  const { error } = useAuth();
  return error;
};

export default AuthContext;