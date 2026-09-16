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
          setSession(null);
          setUser(null);
          setProfile(null);
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
          setProfile(null);
          setLoading(false);
          return;
        }

        // Load profile after authentication state changes.
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

        // After email confirmation, redirect directly
        // to the TechDudes Internship Portal.
        emailRedirectTo:
          "https://www.techdudes.in/internship",
      },
    });

    if (error) {
      console.error("Registration error:", error.message);

      return {
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        error: "Registration failed — please try again.",
      };
    }

    // Supabase may return a successful-looking response
    // when the email is already registered.
    if (data.user.identities?.length === 0) {
      return {
        error:
          "This email address is already registered. Please login instead.",
      };
    }

    /*
      IMPORTANT:

      We DO NOT insert into public.profiles here.

      Supabase handles this automatically:

          auth.users
              ↓
          on_auth_user_created
              ↓
          handle_new_student()
              ↓
          public.profiles
    */

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
      console.error("Login error:", error.message);

      return {
        error: error.message,
      };
    }

    /*
      IMPORTANT:

      We intentionally DO NOT navigate here.

      The Login page handles navigation after authentication.

      Admin:
        → /admin/internship

      Student:
        → /internship
    */

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
      console.error("Logout error:", error.message);
    }

    // Immediately clear local authentication state.
    setUser(null);
    setSession(null);
    setProfile(null);
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