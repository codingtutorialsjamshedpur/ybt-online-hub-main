import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  UserCredential
} from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { User } from "../types";
// User type already includes photoURL in types.ts
import { uploadUserAvatar } from "../firebase/storage";

/**
 * Register a new user
 * @param email User email
 * @param password User password
 * @param userData Additional user data
 * @returns Firebase user credential
 */
export const registerUser = async (
  email: string,
  password: string,
  userData: Omit<User, "id" | "email">
): Promise<UserCredential> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    // Update profile with displayName
    if (userData.name) {
      await updateProfile(user, {
        displayName: userData.name
      });
    }
    
    // Store additional user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      email: email,
      ...userData,
      role: userData.role || "customer",
      createdAt: new Date().toISOString()
    });
    
    return userCredential;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

/**
 * Log in a user
 * @param email User email
 * @param password User password
 * @returns Firebase user credential
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

/**
 * Log out the current user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

/**
 * Send a password reset email
 * @param email Email address to send password reset to
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error sending password reset:", error);
    throw error;
  }
};

/**
 * Update a user's profile
 * @param user Firebase user
 * @param data Profile data to update
 * @param avatar Optional avatar file
 */
export const updateUserProfile = async (
  user: FirebaseUser,
  data: Partial<User>,
  avatar?: File
): Promise<void> => {
  try {
    // Update Firebase Auth profile
    const updateData: any = {};
    
    if (data.name) {
      updateData.displayName = data.name;
    }
    
    // Upload avatar if provided
    if (avatar) {
      const photoURL = await uploadUserAvatar(avatar, user.uid);
      updateData.photoURL = photoURL;
      data.photoURL = photoURL;
    }
    
    if (Object.keys(updateData).length > 0) {
      await updateProfile(user, updateData);
    }
    
    // Update email if changed
    if (data.email && data.email !== user.email) {
      await updateEmail(user, data.email);
    }
    
    // Update Firestore user document
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

/**
 * Update a user's password
 * @param user Firebase user
 * @param newPassword New password
 */
export const changePassword = async (
  user: FirebaseUser,
  newPassword: string
): Promise<void> => {
  try {
    await updatePassword(user, newPassword);
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};

/**
 * Get full user data from Firestore
 * @param userId User ID
 * @returns User data or null if not found
 */
export const getUserData = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

/**
 * Sign in with Google
 * Creates a new user record if this is their first login
 * @returns Firebase user credential
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    // Add scopes if needed
    provider.addScope('profile');
    provider.addScope('email');
    
    // Use the provided client ID
    provider.setCustomParameters({
      'login_hint': 'user@example.com',
      'client_id': '512102174837-g4uen1ri47o7q6c4glqth1qjnnjk9vo6.apps.googleusercontent.com'
    });
    
    const result = await signInWithPopup(auth, provider);
    
    // Check if this is a new user
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    
    if (!userDoc.exists()) {
      // Create a new user document in Firestore
      // Generate a username from email or display name
      const username = result.user.email
        ? result.user.email.split('@')[0]
        : result.user.displayName
          ? result.user.displayName.replace(/\s+/g, '').toLowerCase()
          : `user${Math.floor(Math.random() * 10000)}`;
      
      await setDoc(doc(db, "users", result.user.uid), {
        id: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        username: username, // Add required username field
        photoURL: result.user.photoURL,
        role: "customer",
        createdAt: new Date().toISOString()
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};
