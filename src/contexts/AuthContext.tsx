import React, { useState, useEffect } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AuthContext } from "./auth-context";
import type { UserProfile, AuthContextType } from "./types";

export type { UserProfile, AuthContextType };
export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Do not block auth readiness on Firestore latency.
        void fetchUserProfile(currentUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Prepare and set UI profile immediately.
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        name,
        createdAt: new Date().toISOString(),
      };

      setUserProfile(userProfile);

      // Do not block navigation on Firestore profile write.
      void setDoc(doc(db, "users", result.user.uid), userProfile).catch((err) => {
        console.error("Error saving user profile:", err);
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign up";
      setError(errorMessage);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Fetch profile in background to keep sign-in responsive.
      void fetchUserProfile(result.user.uid);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign in";
      setError(errorMessage);
      throw err;
    }
  };

  const logOut = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to log out";
      setError(errorMessage);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    logOut,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
