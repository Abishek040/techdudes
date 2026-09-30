import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

// ============================================================
// GENERAL AUTHENTICATED ROUTE
// ============================================================

export function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoading />;
  }

  // User is not logged in
  if (!user) {
    return (
      <Navigate
        to="/internship/login"
        replace
      />
    );
  }

  return <>{children}</>;
}

// ============================================================
// ADMIN ONLY ROUTE
// ============================================================

export function AdminRoute({
  children,
}: {
  children: ReactNode;
}) {
  const {
    user,
    profile,
    loading,
  } = useAuth();

  if (loading) {
    return <PageLoading />;
  }

  // ----------------------------------------------------------
  // NOT LOGGED IN
  // ----------------------------------------------------------

  if (!user) {
    return (
      <Navigate
        to="/internship/login"
        replace
      />
    );
  }

  // ----------------------------------------------------------
  // LOGGED IN BUT NOT ADMIN
  // ----------------------------------------------------------

  if (profile?.role !== "admin") {
    return (
      <Navigate
        to="/internship"
        replace
      />
    );
  }

  // ----------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------

  return <>{children}</>;
}

// ============================================================
// LOADING SCREEN
// ============================================================

function PageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">
        Loading…
      </div>
    </div>
  );
}