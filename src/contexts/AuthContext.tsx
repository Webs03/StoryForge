import React, { useState, useEffect } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, firebaseInitError } from "@/lib/firebase";
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

  const getDefaultName = (currentUser: User) => {
    if (currentUser.displayName?.trim()) return currentUser.displayName.trim();
    if (currentUser.email?.includes("@")) return currentUser.email.split("@")[0];
    return "Writer";
  };

  const getAuthInstance = () => {
    if (!auth) {
      throw new Error(firebaseInitError ?? "Firebase authentication is not configured");
    }
    return auth;
  };

  const getDbInstance = () => {
    if (!db) {
      throw new Error(firebaseInitError ?? "Firestore is not configured");
    }
    return db;
  };

  const upsertUserProfile = async (
    currentUser: User,
    preferredName?: string,
    options?: { touchLastSignIn?: boolean }
  ) => {
    try {
      const touchLastSignIn = options?.touchLastSignIn ?? false;
      const firestore = getDbInstance();
      const docRef = doc(firestore, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      const existingProfile = docSnap.exists()
        ? (docSnap.data() as Partial<UserProfile>)
        : null;

      const profile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email ?? existingProfile?.email ?? "",
        name: preferredName?.trim() || existingProfile?.name || getDefaultName(currentUser),
        createdAt: existingProfile?.createdAt || new Date().toISOString(),
        lastSignInAt: touchLastSignIn
          ? new Date().toISOString()
          : existingProfile?.lastSignInAt,
        photoURL: currentUser.photoURL ?? existingProfile?.photoURL ?? null,
      };

      setUserProfile(profile);
      await setDoc(docRef, profile, { merge: true });
      return profile;
    } catch (err) {
      console.error("Error upserting user profile:", err);
      throw err;
    }
  };

  const fetchUserProfile = async (currentUser: User) => {
    try {
      const firestore = getDbInstance();
      const docRef = doc(firestore, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
        return;
      }

      await upsertUserProfile(currentUser);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  useEffect(() => {
    if (!auth) {
      setError(firebaseInitError ?? "Firebase authentication is not configured");
      setLoading(false);
      return () => undefined;
    }

    try {
      const authInstance = getAuthInstance();
      const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          // Do not block auth readiness on Firestore latency.
          void fetchUserProfile(currentUser);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Failed to initialize auth state listener:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize authentication");
      setLoading(false);
    }

    return () => undefined;
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      const authInstance = getAuthInstance();
      const result = await createUserWithEmailAndPassword(authInstance, email, password);
      await upsertUserProfile(result.user, name, { touchLastSignIn: true });
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
      const authInstance = getAuthInstance();
      const result = await signInWithEmailAndPassword(authInstance, email, password);
      // Ensure user profile exists and refresh login timestamp.
      await upsertUserProfile(result.user, undefined, { touchLastSignIn: true });
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
      const authInstance = getAuthInstance();
      await signOut(authInstance);
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
