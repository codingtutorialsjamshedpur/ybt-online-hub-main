import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from "../firebase/config";
import { User } from "../types";
import { initializeUserPanel } from "../services/userPanelService";
import { loginUser, registerUser, logoutUser, signInWithGoogle } from '../services/authService';
import { getUserProfile, syncUserProfile } from '../services/userService';

// User type already includes photoURL in types.ts

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  user: FirebaseUser | null; // Alias for currentUser for compatibility
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  register: (email: string, username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>; // Added function to refresh user data
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user data from Firestore with enhanced sync
  const fetchUserData = async (userId: string) => {
    try {
      // Try to get user data, or create/sync if it doesn't exist
      const userData = await getUserProfile(userId);
      
      if (userData) {
        setUserData(userData);
      } else {
        // If getUserProfile fails, try a direct sync
        const syncedData = await syncUserProfile(userId);
        if (syncedData) {
          setUserData(syncedData);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Function to refresh user data - exposed in the context
  const refreshUserData = async () => {
    if (currentUser) {
      await fetchUserData(currentUser.uid);
    }
  };

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          // Fetch user data from Firestore
          await fetchUserData(firebaseUser.uid);
          
          // Initialize or update the User_Panel document
          await initializeUserPanel(firebaseUser.uid, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            phoneNumber: firebaseUser.phoneNumber
          });
        } catch (error) {
          console.error("Error in auth state change:", error);
        }
        setCurrentUser(firebaseUser);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Register new user
  const register = async (email: string, username: string, password: string) => {
    try {
      await registerUser(email, password, { name: username, username, role: 'user' });
      console.log('Registration successful');
    } catch (error: any) {
      console.error('Registration failed:', error.message);
      throw error;
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      await loginUser(email, password);
      console.log('Login successful');
    } catch (error: any) {
      console.error('Login failed:', error.message);
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      await signInWithGoogle();
      console.log('Google login successful');
    } catch (error: any) {
      console.error('Google login failed:', error.message);
      throw error;
    }
  };

  // Admin login (without Firebase for this demo)
  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    if (username === 'admin' && password === 'admin123') {
      // Set admin data without firebase auth
      setUserData({
        id: 'admin-123',
        email: 'admin@ybt.com',
        name: 'Admin User',
        username: 'admin',  // Add the required username field
        role: 'admin'
      });
      console.log('Admin login successful');
      return true;
    }
    console.error('Admin login failed: Invalid credentials');
    return false;
  };

  // Logout user
  const logout = async () => {
    try {
      await logoutUser();
      // Also clear admin data if any
      setUserData(null);
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout failed:', error.message);
      throw error;
    }
  };

  // Context value
  const value: AuthContextType = {
    currentUser,
    userData,
    user: currentUser, // Alias for compatibility
    login,
    adminLogin,
    register,
    loginWithGoogle,
    logout,
    refreshUserData,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
