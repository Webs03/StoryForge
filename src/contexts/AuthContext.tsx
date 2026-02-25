import React, { useState, useEffect } from "react";
import type { FirebaseError } from "firebase/app";
import {
  User,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, firebaseInitError } from "@/lib/firebase";
import { AuthContext } from "./auth-context";
import type { UserProfile, AuthContextType } from "./types";

export type { UserProfile, AuthContextType };
export { AuthContext };

const getErrorCode = (err: unknown) => {
  if (typeof err !== "object" || err === null) return null;
  const maybeError = err as Partial<FirebaseError>;
  if (typeof maybeError.code !== "string") return null;
  return maybeError.code.replace(/^[^/]+\//, "");
};

const isOfflineError = (err: unknown) => {
  const code = getErrorCode(err);
  if (code === "unavailable") return true;
  if (err instanceof Error && /offline/i.test(err.message)) return true;
  return false;
};

const getAuthErrorMessage = (err: unknown, fallback: string) => {
  const code = getErrorCode(err);
  switch (code) {
    case "unauthorized-domain":
      return "This domain is not authorized for Google sign-in. Add it in Firebase Authentication > Settings > Authorized domains.";
    case "operation-not-allowed":
      return "Google sign-in is not enabled in Firebase Authentication.";
    case "popup-blocked":
      return "Google sign-in popup was blocked by your browser.";
    case "popup-closed-by-user":
      return "Google sign-in popup was closed before completion.";
    case "network-request-failed":
      return "Network error during sign in. Please try again.";
    case "too-many-requests":
      return "Too many sign-in attempts. Please try again in a few minutes.";
    default:
      return err instanceof Error ? err.message : fallback;
  }
};

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

  const buildFallbackProfile = (
    currentUser: User,
    preferredName?: string,
    options?: { touchLastSignIn?: boolean }
  ): UserProfile => ({
    uid: currentUser.uid,
    email: currentUser.email ?? "",
    name: preferredName?.trim() || getDefaultName(currentUser),
    createdAt: new Date().toISOString(),
    lastSignInAt: options?.touchLastSignIn ? new Date().toISOString() : undefined,
    photoURL: currentUser.photoURL ?? null,
  });

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
      let existingProfile: Partial<UserProfile> | null = null;

      try {
        const docSnap = await getDoc(docRef);
        existingProfile = docSnap.exists()
          ? (docSnap.data() as Partial<UserProfile>)
          : null;
      } catch (err) {
        if (!isOfflineError(err)) throw err;
      }

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
      try {
        await setDoc(docRef, profile, { merge: true });
      } catch (err) {
        if (!isOfflineError(err)) throw err;
        console.warn("Skipping profile sync while offline.");
      }

      return profile;
    } catch (err) {
      console.error("Error upserting user profile:", err);
      throw err;
    }
  };

  const fetchUserProfile = async (currentUser: User) => {
    const fallbackProfile = buildFallbackProfile(currentUser);

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
      if (isOfflineError(err)) {
        setUserProfile((previous) => previous ?? fallbackProfile);
        return;
      }
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
      setUser(result.user);
      setUserProfile(buildFallbackProfile(result.user, name, { touchLastSignIn: true }));

      // Keep auth flows fast; sync profile without blocking navigation.
      void upsertUserProfile(result.user, name, { touchLastSignIn: true }).catch((err) => {
        console.error("Background profile sync failed after sign up:", err);
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
      const authInstance = getAuthInstance();
      const result = await signInWithEmailAndPassword(authInstance, email, password);
      setUser(result.user);
      setUserProfile((previous) =>
        previous ?? buildFallbackProfile(result.user, undefined, { touchLastSignIn: true })
      );

      // Ensure profile exists and refresh login timestamp in background.
      void upsertUserProfile(result.user, undefined, { touchLastSignIn: true }).catch((err) => {
        console.error("Background profile sync failed after sign in:", err);
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign in";
      setError(errorMessage);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const authInstance = getAuthInstance();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(authInstance, provider);

      setUser(result.user);
      setUserProfile((previous) =>
        previous ?? buildFallbackProfile(result.user, result.user.displayName ?? undefined, { touchLastSignIn: true })
      );

      void upsertUserProfile(
        result.user,
        result.user.displayName ?? undefined,
        { touchLastSignIn: true }
      ).catch((err) => {
        console.error("Background profile sync failed after Google sign in:", err);
      });
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err, "Failed to sign in with Google");
      setError(errorMessage);
      throw new Error(errorMessage);
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
    signInWithGoogle,
    logOut,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
