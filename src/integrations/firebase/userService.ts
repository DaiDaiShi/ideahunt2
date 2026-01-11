import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from './config';

export interface UserProfile {
  id: string;
  email: string;
  user_name: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Get user profile by ID
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      email: data.email || '',
      user_name: data.user_name || '',
      display_name: data.display_name || null,
      bio: data.bio || null,
      avatar_url: data.avatar_url || null,
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
    };
  }
  return null;
};

// Check if username is available
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const q = query(collection(db, 'users'), where('user_name', '==', username));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

// Create user profile
export const createUserProfile = async (
  userId: string,
  email: string,
  userName: string
): Promise<UserProfile> => {
  const now = new Date().toISOString();
  const profile = {
    email,
    user_name: userName,
    display_name: null,
    bio: null,
    avatar_url: null,
    created_at: now,
    updated_at: now,
  };

  await setDoc(doc(db, 'users', userId), profile);

  return { id: userId, ...profile };
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: {
    display_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  }
): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  await setDoc(
    docRef,
    {
      ...updates,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
};

// Update username
export const updateUsername = async (userId: string, userName: string): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  await setDoc(
    docRef,
    {
      user_name: userName,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
};

// Get user by username
export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
  const q = query(collection(db, 'users'), where('user_name', '==', username));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    email: data.email || '',
    user_name: data.user_name || '',
    display_name: data.display_name || null,
    bio: data.bio || null,
    avatar_url: data.avatar_url || null,
    created_at: data.created_at || '',
    updated_at: data.updated_at || '',
  };
};
