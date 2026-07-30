import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { supabase } from "./supabase";
// ─── Types ───────────────────────────────────────────────────
export type StorageMode = "local" | "cloud";
interface AuthContextType {
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => Promise<void>;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; success?: boolean }>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType>({
  storageMode: "local",
  setStorageMode: async () => {},
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
});
// ─── Global resolver for storage.ts (no React import needed) ─
const STORAGE_MODE_KEY = "agenda_storage_mode";
let _currentStorageMode: StorageMode = "local";
let _currentUserId: string | undefined;
/** Called by storage.ts to check if cloud should be used */
export function shouldUseCloud(): boolean {
  return _currentStorageMode === "cloud" && Boolean(_currentUserId);
}
/** Called by storage.ts to get the current user id for RLS */
export function getCurrentUserId(): string | undefined {
  return _currentUserId;
}
// ─── Provider ────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [storageMode, setStorageModeState] = useState<StorageMode>("local");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Keep global resolver in sync
  useEffect(() => {
    _currentStorageMode = storageMode;
    _currentUserId = user?.id;
  }, [storageMode, user]);
  // Restore persisted storage mode + Supabase session on mount
  useEffect(() => {
    const init = async () => {
      try {
        const storedMode = await AsyncStorage.getItem(STORAGE_MODE_KEY);
        if (storedMode === "local" || storedMode === "cloud") {
          setStorageModeState(storedMode);
          _currentStorageMode = storedMode;
        }
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();
        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
          _currentUserId = existingSession.user.id;
        }
      } catch (err) {
        console.warn("AuthContext init error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);
  // Subscribe to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      _currentUserId = newSession?.user?.id;
    });
    return () => subscription.unsubscribe();
  }, []);
  const setStorageMode = useCallback(async (mode: StorageMode) => {
    setStorageModeState(mode);
    _currentStorageMode = mode;
    await AsyncStorage.setItem(STORAGE_MODE_KEY, mode);
  }, []);
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { error: error.message };
      }
      // Session will be picked up by onAuthStateChange
      await setStorageMode("cloud");
      return {};
    },
    [setStorageMode]
  );
  const signUp = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error?: string; success?: boolean }> => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return { error: error.message };
      }
      return { success: true };
    },
    []
  );
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await setStorageMode("local");
  }, [setStorageMode]);
  return (
    <AuthContext.Provider
      value={{
        storageMode,
        setStorageMode,
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
