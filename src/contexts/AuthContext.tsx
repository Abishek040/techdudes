```tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/types/internship";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;

  register: (opts: {
    fullName: string;
    email: string;
    phone: string;
    college: string;
    password: string;
  }) => Promise<{ error: string | null }>;

  login: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;

  logout: () => Promise<void>;

  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

// ============================================================
// 24-HOUR LOGIN LIMIT
// ============================================================

const LOGIN_TIMESTAMP_KEY = "techdudes_login_timestamp";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // LOAD USER PROFILE
  // ------------------------------------------------------------

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error loading profile:", error.message);
      setProfile(null);
      return null;
    }

    const loadedProfile = data as Profile;

    setProfile(loadedProfile);

    return loadedProfile;
  };

  // ------------------------------------------------------------
  // CLEAR LOCAL AUTH STATE
  // ------------------------------------------------------------

  const clearAuthState = () => {
    localStorage.removeItem(LOGIN_TIMESTAMP_KEY);

    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // ------------------------------------------------------------
  // AUTOMATIC 24-HOUR LOGOUT
  // ------------------------------------------------------------

  const checkLoginExpiry = async () => {
    const loginTimestamp = localStorage.getItem(
      LOGIN_TIMESTAMP_KEY
    );

    if (!loginTimestamp) {
      return false;
    }

    const loginTime = Number(loginTimestamp);

    if (Number.isNaN(loginTime)) {
      localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
      return false;
    }

    const elapsed = Date.now() - loginTime;

    // ----------------------------------------------------------
    // 24 HOURS COMPLETED
    // ----------------------------------------------------------

    if (elapsed >= TWENTY_FOUR_HOURS) {
      console.log(
        "24-hour login limit reached. Logging out..."
      );

      await supabase.auth.signOut();

      clearAuthState();

      return true;
    }

    return false;
  };

  // ------------------------------------------------------------
  // INITIAL AUTH CHECK
  // ------------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        // ------------------------------------------------------
        // CHECK 24-HOUR LOGIN EXPIRY
        // ------------------------------------------------------

        if (session?.user) {
          const expired = await checkLoginExpiry();

          if (expired) {
            if (mounted) {
              setLoading(false);
            }

            return;
          }
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error(
          "Authentication initialization error:",
          error
        );

        if (mounted) {
          clearAuthState();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // ----------------------------------------------------------
    // AUTH STATE LISTENER
    // ----------------------------------------------------------

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (!session?.user) {
          clearAuthState();
          setLoading(false);
          return;
        }

        void loadProfile(session.user.id).finally(() => {
          if (mounted) {
            setLoading(false);
          }
        });
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ------------------------------------------------------------
  // 24-HOUR EXPIRATION TIMER
  // ------------------------------------------------------------

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const loginTimestamp = localStorage.getItem(
      LOGIN_TIMESTAMP_KEY
    );

    if (!loginTimestamp) {
      return;
    }

    const loginTime = Number(loginTimestamp);

    if (Number.isNaN(loginTime)) {
      return;
    }

    const remainingTime =
      TWENTY_FOUR_HOURS -
      (Date.now() - loginTime);

    // ----------------------------------------------------------
    // ALREADY EXPIRED
    // ----------------------------------------------------------

    if (remainingTime <= 0) {
      void logout();
      return;
    }

    // ----------------------------------------------------------
    // SET TIMER FOR EXACT EXPIRATION
    // ----------------------------------------------------------

    const timer = window.setTimeout(() => {
      console.log(
        "24-hour login limit reached. Logging out..."
      );

      void logout();
    }, remainingTime);

    return () => {
      window.clearTimeout(timer);
    };
  }, [session?.user]);

  // ------------------------------------------------------------
  // REGISTER
  // ------------------------------------------------------------

  const register: AuthContextValue["register"] = async ({
    fullName,
    email,
    phone,
    college,
    password,
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,

      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          college: college.trim(),
        },

        emailRedirectTo:
          "https://www.techdudes.in/internship",
      },
    });

    if (error) {
      console.error(
        "Registration error:",
        error.message
      );

      return {
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        error:
          "Registration failed — please try again.",
      };
    }

    if (data.user.identities?.length === 0) {
      return {
        error:
          "This email address is already registered. Please login instead.",
      };
    }

    return {
      error: null,
    };
  };

  // ------------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------------

  const login: AuthContextValue["login"] = async (
    email,
    password
  ) => {
    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      console.error(
        "Login error:",
        error.message
      );

      return {
        error: error.message,
      };
    }

    // ----------------------------------------------------------
    // START 24-HOUR LOGIN PERIOD
    // ----------------------------------------------------------

    localStorage.setItem(
      LOGIN_TIMESTAMP_KEY,
      Date.now().toString()
    );

    return {
      error: null,
    };
  };

  // ------------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------------

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(
        "Logout error:",
        error.message
      );
    }

    clearAuthState();
  };

  // ------------------------------------------------------------
  // REFRESH PROFILE
  // ------------------------------------------------------------

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    await loadProfile(user.id);
  };

  // ------------------------------------------------------------
  // ADMIN CHECK
  // ------------------------------------------------------------

  const isAdmin = profile?.role === "admin";

  // ------------------------------------------------------------
  // CONTEXT PROVIDER
  // ------------------------------------------------------------

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAdmin,

        register,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// --------------------------------------------------------------
// useAuth HOOK
// --------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}
```
