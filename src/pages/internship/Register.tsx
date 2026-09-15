import { useEffect, useState } from "react";
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

const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    college: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  /* ================================================================
     IF ALREADY LOGGED IN
  ================================================================ */

  useEffect(() => {
    if (user && !confirmationSent) {
      navigate("/internship", {
        replace: true,
      });
    }
  }, [user, confirmationSent, navigate]);

  /* ================================================================
     UPDATE FORM
  ================================================================ */

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [key]: e.target.value,
      }));

      // Remove old error while user is correcting the field.
      if (error) {
        setError(null);
      }
    };

  /* ================================================================
     VALIDATION
  ================================================================ */

  const validateForm = () => {
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const college = form.college.trim();

    /* --------------------------------------------------------------
       REQUIRED FIELDS
    -------------------------------------------------------------- */

    if (
      !fullName ||
      !email ||
      !phone ||
      !college ||
      !form.password ||
      !form.confirmPassword
    ) {
      return "Please fill in all fields.";
    }

    /* --------------------------------------------------------------
       EMAIL
       
       Only Gmail addresses are accepted.
       
       Examples:
       ✅ student@gmail.com
       ❌ student@yahoo.com
       ❌ student@gmail.in
       ❌ student@gamil.com
       ❌ student@gmail
    -------------------------------------------------------------- */

    const gmailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i;

    if (!gmailRegex.test(email)) {
      return "Please enter a valid Gmail address ending with @gmail.com.";
    }

    /* --------------------------------------------------------------
       PHONE
       
       Required:
       +91 + exactly 10 digits
       
       Example:
       +919876543210
    -------------------------------------------------------------- */

    const phoneRegex = /^\+91[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      return "Enter a valid Indian mobile number with country code, e.g. +919876543210.";
    }

    /* --------------------------------------------------------------
       PASSWORD
    -------------------------------------------------------------- */

    if (form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    /* --------------------------------------------------------------
       CONFIRM PASSWORD
    -------------------------------------------------------------- */

    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  };

  /* ================================================================
     SUBMIT
  ================================================================ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    const { error: regErr } = await register({
      fullName: form.fullName.trim(),
      email,
      phone,
      college: form.college.trim(),
      password: form.password,
    });

    setSubmitting(false);

    /* --------------------------------------------------------------
       REGISTRATION ERROR
    -------------------------------------------------------------- */

    if (regErr) {
      const message = regErr.toLowerCase();

      if (
        message.includes("already registered") ||
        message.includes("already exists") ||
        message.includes("user already")
      ) {
        setError(
          "This email address is already registered. Please use another Gmail address or log in."
        );
      } else {
        setError(regErr);
      }

      return;
    }

    /* --------------------------------------------------------------
       SUCCESS
       
       DO NOT NAVIGATE TO THE INTERNSHIP PORTAL.
       
       User must first click the confirmation email.
    -------------------------------------------------------------- */

    setConfirmationSent(true);
  };

  /* ================================================================
     EMAIL CONFIRMATION SCREEN
  ================================================================ */

  if (confirmationSent) {
    return (
      <div className="pt-32 pb-24 max-w-md mx-auto px-6">

        <Card
          className="
            border border-white/10
            bg-white/[0.035]
            backdrop-blur-xl
            shadow-[0_8px_32px_rgba(0,0,0,0.25)]
            rounded-2xl
          "
        >

          <CardHeader className="text-center">

            <div
              className="
                mx-auto
                mb-4
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                border
                border-primary/20
                bg-primary/[0.08]
                text-primary
                text-2xl
              "
            >
              ✓
            </div>

            <CardTitle className="text-2xl">
              Confirmation email sent
            </CardTitle>

          </CardHeader>

          <CardContent className="text-center space-y-5">

            <p className="text-muted-foreground">
              Your account registration has been received.
            </p>

            <div
              className="
                rounded-xl
                border border-white/10
                bg-white/[0.03]
                backdrop-blur-lg
                p-4
              "
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Confirmation email
              </p>

              <p className="text-foreground font-medium break-all">
                {form.email.trim().toLowerCase()}
              </p>
            </div>

            <p className="text-sm text-muted-foreground leading-6">
              Please open the confirmation email and click the
              verification link to activate your account.
            </p>

            <p className="text-sm text-muted-foreground leading-6">
              After your email is verified, you will be logged in
              and redirected to the TechDudes Internship Portal.
            </p>

            <p className="text-xs text-muted-foreground">
              If you don't see the email, please check your
              <strong className="text-foreground">
                {" "}Spam / Junk
              </strong>
              {" "}folder.
            </p>

            <Button
              asChild
              variant="outline"
              className="
                w-full
                border-white/10
                bg-white/[0.03]
                backdrop-blur-md
                hover:bg-white/[0.08]
              "
            >
              <Link to="/internship/login">
                Go to Login
              </Link>
            </Button>

          </CardContent>

        </Card>

      </div>
    );
  }

  /* ================================================================
     REGISTRATION FORM
  ================================================================ */

  return (
    <div className="pt-32 pb-24 max-w-md mx-auto px-6">

      <Card
        className="
          border border-white/10
          bg-white/[0.035]
          backdrop-blur-xl
          shadow-[0_8px_32px_rgba(0,0,0,0.25)]
          rounded-2xl
        "
      >

        <CardHeader>

          <CardTitle className="text-2xl">
            Create your student account
          </CardTitle>

          <p className="text-sm text-muted-foreground mt-1">
            Register with your Gmail address and mobile number.
          </p>

        </CardHeader>

        <CardContent>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* FULL NAME */}

            <Field
              label="Full name"
              value={form.fullName}
              onChange={update("fullName")}
              placeholder="Enter your full name"
            />

            {/* EMAIL */}

            <Field
              label="Gmail address"
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="example@gmail.com"
              autoComplete="email"
            />

            <p className="text-xs text-muted-foreground -mt-2">
              Only Gmail addresses ending with @gmail.com are accepted.
            </p>

            {/* PHONE */}

            <Field
              label="Mobile number"
              value={form.phone}
              onChange={update("phone")}
              placeholder="+919876543210"
              inputMode="tel"
              autoComplete="tel"
            />

            <p className="text-xs text-muted-foreground -mt-2">
              Enter +91 followed by exactly 10 digits.
            </p>

            {/* COLLEGE */}

            <Field
              label="College / Institution"
              value={form.college}
              onChange={update("college")}
              placeholder="Enter your college or institution"
            />

            {/* PASSWORD */}

            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={update("password")}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />

            {/* CONFIRM PASSWORD */}

            <Field
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />

            {/* ERROR */}

            {error && (
              <div
                className="
                  rounded-xl
                  border border-destructive/20
                  bg-destructive/[0.06]
                  backdrop-blur-md
                  px-4
                  py-3
                "
              >
                <p className="text-destructive text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* REGISTER */}

            <Button
              type="submit"
              className="w-full neon-btn"
              disabled={submitting}
            >
              {submitting
                ? "Creating account…"
                : "Register"}
            </Button>

          </form>

          <p className="text-sm text-muted-foreground mt-5 text-center">
            Already have an account?{" "}
            <Link
              to="/internship/login"
              className="text-primary hover:underline"
            >
              Log in
            </Link>
          </p>

        </CardContent>

      </Card>

    </div>
  );
};

/* ================================================================
   FIELD COMPONENT
================================================================ */

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  type?: string;
  placeholder?: string;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  autoComplete?: string;
}) => (
  <div className="space-y-1.5">

    <Label>
      {label}
    </Label>

    <Input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      inputMode={inputMode}
      autoComplete={autoComplete}
      required
      className="
        bg-white/[0.025]
        border-white/10
        backdrop-blur-md
        focus:border-primary/40
        focus:ring-primary/20
      "
    />

  </div>
);

export default Register;