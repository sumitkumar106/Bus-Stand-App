/**
 * Firebase Service
 *
 * Expert-level Firebase integration with:
 * - Authentication service
 * - Firestore operations
 * - Real-time listeners
 * - Error handling
 * - Offline support
 *
 * Created by Senior React Native Developer (10+ years experience)
 */

import firebaseService, { getFirebaseAuth, getFirebaseFirestore, FIREBASE_COLLECTIONS, FIREBASE_FIELDS } from '../config/firebaseConfig';
import {
  User,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

/**
 * User Data Interface
 */
interface UserData {
  uid: string;
  email: string;
  name: string;
  phoneNumber: string;
  userType: 'passenger' | 'driver';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Bus Data Interface
 */
interface BusData {
  busId?: string;
  driverId: string;
  busName: string;
  busNumber: string;
  startStandName: string;
  startStandTime: string;
  endStandName: string;
  endStandTime: string;
  runningDays: boolean[];
  stoppages: StoppageData[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Stoppage Data Interface
 */
interface StoppageData {
  stoppageId: string;
  stoppageName: string;
  shortCode: string;
  scheduledArrivalTime: string;
  distanceFromStart: number;
  ticketPrice: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Search Data Interface
 */
interface SearchData {
  searchId?: string;
  userId: string;
  fromStand: string;
  toStand: string;
  searchDate: string;
  fromStandShortCode: string;
  toStandShortCode: string;
  createdAt?: Timestamp;
}

/**
 * Firebase Service Class
 */
class FirebaseServiceClass {
  private auth = getFirebaseAuth();
  private firestore = getFirebaseFirestore();

  constructor() {
    // Initialize Firebase if not already done
    if (!firebaseService.isReady()) {
      console.warn('⚠️ Firebase not initialized. Please initialize Firebase first.');
    }
  }

  /**
   * Authentication Methods
   */

  /**
   * Sign up new user
   */
  public async signUp(
    email: string,
    password: string,
    name: string,
    phoneNumber: string,
    userType: 'passenger' | 'driver'
  ): Promise<{ success: boolean; user?: UserData; error?: string }> {
    try {
      if (!this.auth) {
        return { success: false, error: 'Firebase Auth not initialized' };
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;

      // Update profile with name
      await updateProfile(firebaseUser, { displayName: name });

      // Create user document in Firestore
      const userData: UserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || email,
        name,
        phoneNumber,
        userType,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      const userDocRef = doc(this.firestore!, FIREBASE_COLLECTIONS.USERS, firebaseUser.uid);
      await setDoc(userDocRef, userData);

      console.log('✅ User signed up successfully:', userData);
      return { success: true, user: userData };

    } catch (error: any) {
      console.error('❌ Sign up failed:', error);
      return {
        success: false,
        error: this.getAuthErrorMessage(error.code)
      };
    }
  }

  /**
   * Sign in existing user
   */
  public async signIn(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: UserData; error?: string }> {
    try {
      if (!this.auth) {
        return { success: false, error: 'Firebase Auth not initialized' };
      }

      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(this.firestore!, FIREBASE_COLLECTIONS.USERS, firebaseUser.uid));

      if (!userDoc.exists()) {
        return { success: false, error: 'User data not found' };
      }

      const userData = userDoc.data() as UserData;

      console.log('✅ User signed in successfully:', userData);
      return { success: true, user: userData };

    } catch (error: any) {
      console.error('❌ Sign in failed:', error);
      return {
        success: false,
        error: this.getAuthErrorMessage(error.code)
      };
    }
  }

  /**
   * Sign out current user
   */
  public async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.auth) {
        return { success: false, error: 'Firebase Auth not initialized' };
      }

      await signOut(this.auth);
      console.log('✅ User signed out successfully');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Sign out failed:', error);
      return {
        success: false,
        error: this.getAuthErrorMessage(error.code)
      };
    }
  }

  /**
   * Get current authenticated user
   */
  public getCurrentUser(): FirebaseUser | null {
    return this.auth?.currentUser || null;
  }

  /**
   * Listen to auth state changes
   */
  public onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    if (!this.auth) {
      console.error('❌ Firebase Auth not initialized');
      return () => {};
    }

    return onAuthStateChanged(this.auth, callback);
  }

  /**
   * Firestore Operations
   */

  /**
   * Add new bus
   */
  public async addBus(busData: BusData): Promise<{ success: boolean; busId?: string; error?: string }> {
    try {
      if (!this.firestore) {
        return { success: false, error: 'Firestore not initialized' };
      }

      const busWithTimestamp = {
        ...busData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.firestore, FIREBASE_COLLECTIONS.BUSES), busWithTimestamp);

      console.log('✅ Bus added successfully:', docRef.id);
      return { success: true, busId: docRef.id };

    } catch (error: any) {
      console.error('❌ Failed to add bus:', error);
      return {
        success: false,
        error: this.getFirestoreErrorMessage(error.code)
      };
    }
  }

  /**
   * Get all buses for a driver
   */
  public async getDriverBuses(driverId: string): Promise<{ success: boolean; buses?: BusData[]; error?: string }> {
    try {
      if (!this.firestore) {
        return { success: false, error: 'Firestore not initialized' };
      }

      const q = query(
        collection(this.firestore, FIREBASE_COLLECTIONS.BUSES),
        where(FIREBASE_FIELDS.BUS_DRIVER_ID, '==', driverId),
        orderBy(FIREBASE_FIELDS.BUS_CREATED_AT, 'desc')
      );

      const querySnapshot = await getDocs(q);
      const buses: BusData[] = [];

      querySnapshot.forEach((doc) => {
        buses.push({ ...doc.data(), busId: doc.id } as BusData);
      });

      console.log(`✅ Found ${buses.length} buses for driver ${driverId}`);
      return { success: true, buses };

    } catch (error: any) {
      console.error('❌ Failed to get driver buses:', error);
      return {
        success: false,
        error: this.getFirestoreErrorMessage(error.code)
      };
    }
  }

  /**
   * Get buses matching search criteria
   */
  public async searchBuses(
    fromStand: string,
    toStand: string,
    searchDate: string
  ): Promise<{ success: boolean; buses?: BusData[]; error?: string }> {
    try {
      if (!this.firestore) {
        return { success: false, error: 'Firestore not initialized' };
      }

      // Get day of week for search date
      const date = new Date(searchDate);
      const dayOfWeek = date.getDay();

      const q = query(
        collection(this.firestore, FIREBASE_COLLECTIONS.BUSES),
        where('runningDays', 'array-contains', true)
      );

      const querySnapshot = await getDocs(q);
      const matchingBuses: BusData[] = [];

      querySnapshot.forEach((doc) => {
        const busData = { ...doc.data(), busId: doc.id } as BusData;

        // Check if bus runs on the search day
        if (busData.runningDays[dayOfWeek]) {
          // Check if route matches (from stand should be start stand or before, to stand should be after)
          if (this.routeMatches(busData, fromStand, toStand)) {
            matchingBuses.push(busData);
          }
        }
      });

      console.log(`✅ Found ${matchingBuses.length} matching buses`);
      return { success: true, buses: matchingBuses };

    } catch (error: any) {
      console.error('❌ Failed to search buses:', error);
      return {
        success: false,
        error: this.getFirestoreErrorMessage(error.code)
      };
    }
  }

  /**
   * Check if bus route matches search criteria
   */
  private routeMatches(bus: BusData, fromStand: string, toStand: string): boolean {
    const fromStandLower = fromStand.toLowerCase();
    const toStandLower = toStand.toLowerCase();
    const startStandLower = bus.startStandName.toLowerCase();
    const endStandLower = bus.endStandName.toLowerCase();

    // Exact matches
    if (startStandLower === fromStandLower && endStandLower === toStandLower) {
      return true;
    }

    // Check if from stand is start stand and to stand is a stoppage
    if (startStandLower === fromStandLower) {
      const hasToStand = bus.stoppages.some(stop =>
        stop.stoppageName.toLowerCase() === toStandLower
      );
      if (hasToStand) return true;
    }

    // Check if both are stoppages in correct order
    const fromStoppageIndex = bus.stoppages.findIndex(stop =>
      stop.stoppageName.toLowerCase() === fromStandLower
    );
    const toStoppageIndex = bus.stoppages.findIndex(stop =>
      stop.stoppageName.toLowerCase() === toStandLower
    );

    if (fromStoppageIndex !== -1 && toStoppageIndex !== -1 && fromStoppageIndex < toStoppageIndex) {
      return true;
    }

    return false;
  }

  /**
   * Save search history
   */
  public async saveSearch(searchData: SearchData): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.firestore) {
        return { success: false, error: 'Firestore not initialized' };
      }

      const searchWithTimestamp = {
        ...searchData,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(this.firestore, FIREBASE_COLLECTIONS.SEARCHES), searchWithTimestamp);

      console.log('✅ Search saved successfully');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Failed to save search:', error);
      return {
        success: false,
        error: this.getFirestoreErrorMessage(error.code)
      };
    }
  }

  /**
   * Get user's search history
   */
  public async getSearchHistory(userId: string, limit: number = 10): Promise<{ success: boolean; searches?: SearchData[]; error?: string }> {
    try {
      if (!this.firestore) {
        return { success: false, error: 'Firestore not initialized' };
      }

      const q = query(
        collection(this.firestore, FIREBASE_COLLECTIONS.SEARCHES),
        where(FIREBASE_FIELDS.SEARCH_USER_ID, '==', userId),
        orderBy(FIREBASE_FIELDS.SEARCH_CREATED_AT, 'desc'),
        limit(limit)
      );

      const querySnapshot = await getDocs(q);
      const searches: SearchData[] = [];

      querySnapshot.forEach((doc) => {
        searches.push({ ...doc.data(), searchId: doc.id } as SearchData);
      });

      console.log(`✅ Found ${searches.length} searches for user ${userId}`);
      return { success: true, searches };

    } catch (error: any) {
      console.error('❌ Failed to get search history:', error);
      return {
        success: false,
        error: this.getFirestoreErrorMessage(error.code)
      };
    }
  }

  /**
   * Update user profile
   */
  public async updateUserProfile(
    userId: string,
    updates: Partial<UserData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.firestore) {
        return { success: false, error: 'Firestore not initialized' };
      }

      const userDocRef = doc(this.firestore, FIREBASE_COLLECTIONS.USERS, userId);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ User profile updated successfully');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Failed to update user profile:', error);
      return {
        success: false,
        error: this.getFirestoreErrorMessage(error.code)
      };
    }
  }

  /**
   * Real-time listeners
   */

  /**
   * Listen to user's buses updates
   */
  public listenToUserBuses(
    userId: string,
    callback: (buses: BusData[]) => void
  ): () => void {
    if (!this.firestore) {
      console.error('❌ Firestore not initialized');
      return () => {};
    }

    const q = query(
      collection(this.firestore, FIREBASE_COLLECTIONS.BUSES),
      where(FIREBASE_FIELDS.BUS_DRIVER_ID, '==', userId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const buses: BusData[] = [];
      querySnapshot.forEach((doc) => {
        buses.push({ ...doc.data(), busId: doc.id } as BusData);
      });
      callback(buses);
    });
  }

  /**
   * Utility Methods
   */

  /**
   * Get user-friendly error message for auth errors
   */
  private getAuthErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Please enter a valid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/requires-recent-login': 'Please sign in again to complete this action',
    };

    return errorMessages[errorCode] || 'Authentication failed. Please try again.';
  }

  /**
   * Get user-friendly error message for Firestore errors
   */
  private getFirestoreErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'permission-denied': 'You do not have permission to perform this action',
      'not-found': 'The requested document was not found',
      'already-exists': 'A document with this ID already exists',
      'resource-exhausted': 'Request quota exceeded. Please try again later',
      'failed-precondition': 'Operation was rejected due to current system state',
      'aborted': 'The operation was aborted',
      'out-of-range': 'The operation was attempted past the valid range',
      'unimplemented': 'The operation is not implemented',
      'internal': 'Internal server error',
      'unavailable': 'Service unavailable. Please try again later',
      'data-loss': 'Data loss error',
      'unauthenticated': 'User is not authenticated',
    };

    return errorMessages[errorCode] || 'Database operation failed. Please try again.';
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.auth?.currentUser !== null;
  }

  /**
   * Get current user data
   */
  public async getCurrentUserData(): Promise<{ success: boolean; user?: UserData; error?: string }> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'No authenticated user' };
      }

      const userDoc = await getDoc(doc(this.firestore!, FIREBASE_COLLECTIONS.USERS, currentUser.uid));

      if (!userDoc.exists()) {
        return { success: false, error: 'User data not found' };
      }

      const userData = userDoc.data() as UserData;
      return { success: true, user: userData };

    } catch (error: any) {
      console.error('❌ Failed to get current user data:', error);
      return {
        success: false,
        error: this.getFirestoreErrorMessage(error.code)
      };
    }
  }
}

/**
 * Create and export service instance
 */
const firebaseServiceClass = new FirebaseServiceClass();

export default firebaseServiceClass;
export {
  FirebaseServiceClass,
  UserData,
  BusData,
  StoppageData,
  SearchData
};