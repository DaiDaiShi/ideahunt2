import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleProvider } from "@/integrations/firebase/config";
import { getUserProfile } from "@/integrations/firebase/userService";

// Normalized user interface to maintain compatibility with existing code
interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  user_name: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsUsername: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);

  const loadUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const profile = await getUserProfile(firebaseUser.uid);

      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        user_name: profile?.user_name || null,
      });

      // If no profile exists, user needs to set up username
      setNeedsUsername(!profile);
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        user_name: null,
      });
      setNeedsUsername(true);
    }
  };

  const refreshUserProfile = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await loadUserProfile(currentUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setUser(null);
        setNeedsUsername(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, needsUsername, signInWithGoogle, signOut, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
