import { User } from "firebase/auth";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  createdAt: string;
  lastSignInAt?: string;
  photoURL?: string | null;
}

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  error: string | null;
}
