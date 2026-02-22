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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Don't fetch profile here - only update user state
        // Profile will be fetched during signIn/signUp operations
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
      console.log("🔄 Starting signup process...");
      setError(null);

      const startTime = Date.now();
      console.log("📧 Calling createUserWithEmailAndPassword...");

      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log(`✅ Firebase Auth signup took: ${Date.now() - startTime}ms`);

      // Create user profile in Firestore with retry logic
      console.log("💾 Creating user profile in Firestore...");
      const firestoreStartTime = Date.now();

      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        name,
        createdAt: new Date().toISOString(),
      };

      let retries = 3;
      let profileCreated = false;

      while (retries > 0 && !profileCreated) {
        try {
          await setDoc(doc(db, "users", result.user.uid), userProfile);
          console.log(`✅ Firestore profile creation took: ${Date.now() - firestoreStartTime}ms`);
          setUserProfile(userProfile);
          profileCreated = true;
        } catch (profileErr) {
          console.warn(`⚠️ Profile creation attempt ${4 - retries} failed:`, profileErr);
          retries--;
          
          if (retries > 0) {
            // Wait 500ms before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.warn("⚠️ Could not create profile in Firestore, but auth succeeded");
            setUserProfile(userProfile);
            profileCreated = true;
          }
        }
      }

      console.log("🎉 Signup process complete!");
    } catch (err) {
      console.error("❌ Signup error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to sign up";
      setError(errorMessage);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔄 Starting signin process...");
      setError(null);

      const startTime = Date.now();
      console.log("📧 Calling signInWithEmailAndPassword...");

      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log(`✅ Firebase Auth signin took: ${Date.now() - startTime}ms`);

      // Fetch user profile with retry logic
      console.log("💾 Fetching user profile from Firestore...");
      const firestoreStartTime = Date.now();

      let retries = 3;
      let profileFetched = false;

      while (retries > 0 && !profileFetched) {
        try {
          const docRef = doc(db, "users", result.user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
            console.log(`✅ Firestore profile fetch took: ${Date.now() - firestoreStartTime}ms`);
            profileFetched = true;
          } else {
            console.warn("⚠️ No user profile found in Firestore - this is okay on first signin");
            // Create a basic profile if it doesn't exist
            const basicProfile: UserProfile = {
              uid: result.user.uid,
              email: result.user.email || email,
              name: "",
              createdAt: new Date().toISOString(),
            };
            setUserProfile(basicProfile);
            profileFetched = true;
          }
        } catch (profileErr) {
          console.warn(`⚠️ Profile fetch attempt ${4 - retries} failed:`, profileErr);
          retries--;
          
          if (retries > 0) {
            // Wait 500ms before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            // After all retries fail, allow signin to continue with minimal profile
            console.warn("⚠️ Could not fetch profile from Firestore, but auth succeeded");
            const basicProfile: UserProfile = {
              uid: result.user.uid,
              email: result.user.email || email,
              name: "",
              createdAt: new Date().toISOString(),
            };
            setUserProfile(basicProfile);
            profileFetched = true;
          }
        }
      }

      console.log("🎉 Signin process complete!");
    } catch (err) {
      console.error("❌ Signin error:", err);
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
