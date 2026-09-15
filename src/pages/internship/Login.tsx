import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Login = () => {
  const { login, user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ------------------------------------------------------------
  // Redirect already logged-in users according to their role
  // ------------------------------------------------------------
  useEffect(() => {
    if (loading || !user || !profile) {
      return;
    }

    if (profile.role === "admin") {
      navigate("/admin/internship", {
        replace: true,
      });
      return;
    }

    if (profile.role === "student") {
      navigate("/internship", {
        replace: true,
      });
    }
  }, [user, profile, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);

    const { error: loginErr } = await login(
      email.trim(),
      password
    );

    setSubmitting(false);

    if (loginErr) {
      setError("Incorrect email or password.");
      return;
    }

    /*
     * DO NOT navigate here.
     *
     * AuthContext will update:
     *   user
     *   profile
     *
     * The useEffect above will then decide where
     * the user belongs based on profile.role.
     *
     * ADMIN   → /admin/internship
     * STUDENT → /internship
     */
  };

  return (
    <div className="pt-32 pb-24 max-w-md mx-auto px-6">
      <Card className="border-glass-border bg-glass/40 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">
            Student login
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* EMAIL */}
            <div className="space-y-1.5">
              <Label>Email</Label>

              <Input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
                autoComplete="email"
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <Label>Password</Label>

              <Input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                autoComplete="current-password"
              />
            </div>

            {/* ERROR */}
            {error && (
              <p className="text-destructive text-sm">
                {error}
              </p>
            )}

            {/* LOGIN BUTTON */}
            <Button
              type="submit"
              className="w-full neon-btn"
              disabled={submitting || loading}
            >
              {submitting
                ? "Logging in…"
                : "Log in"}
            </Button>
          </form>

          {/* REGISTER */}
          <p className="text-sm text-muted-foreground mt-4 text-center">
            No account yet?{" "}

            <Link
              to="/internship/register"
              className="text-primary hover:underline"
            >
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;