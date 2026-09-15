import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const EmailVerified = () => {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          setError(sessionError.message);
          setChecking(false);
          return;
        }

        if (!session?.user) {
          setError(
            "Your email could not be verified. Please try the confirmation link again."
          );
          setChecking(false);
          return;
        }

        setVerified(true);
        setChecking(false);

        // Give the user a moment to see the success message.
        setTimeout(() => {
          if (mounted) {
            navigate("/internship", {
              replace: true,
            });
          }
        }, 2000);
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify your email."
        );
        setChecking(false);
      }
    };

    verifySession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />

          <h1 className="text-xl font-semibold">
            Verifying your email...
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Please wait a moment.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl">
            ❌
          </div>

          <h1 className="text-2xl font-bold">
            Email Verification Failed
          </h1>

          <p className="mt-3 text-sm text-muted-foreground">
            {error}
          </p>

          <button
            onClick={() => navigate("/internship/login")}
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-3xl">
            ✓
          </div>

          <h1 className="text-2xl font-bold">
            Your Email Was Verified
          </h1>

          <p className="mt-3 text-base text-muted-foreground">
            Your email was successfully verified and you are now logged in.
          </p>

          <p className="mt-4 text-sm text-muted-foreground">
            Taking you to the Internship Portal...
          </p>

          <div className="mx-auto mt-5 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default EmailVerified;