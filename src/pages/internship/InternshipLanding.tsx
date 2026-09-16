import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import type {
  Enrollment,
  Internship,
} from "@/types/internship";
import SectionHeading from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

/* ================================================================
   FAQ
================================================================ */

const faqs = [
  {
    q: "When is my certificate generated?",
    a: "Your certificate will be generated after completing the specified internship duration from your selected start date, even if you finish the modules and quiz earlier.",
  },
  {
    q: "Can I change my dates after starting?",
    a: "No. Start and end dates are locked once your internship begins, since your certificate is tied to them.",
  },
  {
    q: "How do I verify a certificate?",
    a: "Every certificate has a public verification link and QR code — no login required.",
  },
];

/* ================================================================
   DATE FORMATTER
================================================================ */

const formatDate = (date: string) => {
  const d = new Date(`${date}T00:00:00`);

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ================================================================
   GLASS STYLES
================================================================ */

const glassBox =
  "border border-white/10 bg-white/[0.035] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.18)]";

const glassBoxHover =
  "transition-all duration-300 hover:bg-white/[0.055] hover:border-white/15 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)]";

/* ================================================================
   MAIN COMPONENT
================================================================ */

const InternshipLanding = () => {
  const { user, profile } = useAuth();

  const navigate = useNavigate();

  const [internships, setInternships] = useState<Internship[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);

  /* ==============================================================
     LOAD AVAILABLE INTERNSHIPS
  ============================================================== */

  useEffect(() => {
    const loadInternships = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("internships")
        .select("*")
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Failed to load internships:",
          error
        );

        setInternships([]);
      } else {
        setInternships(
          (data as Internship[]) ?? []
        );
      }

      setLoading(false);
    };

    loadInternships();
  }, []);

  /* ==============================================================
     LOAD STUDENT ENROLLMENTS

     We only need this when the student is logged in.

     Admin accounts do NOT need student enrollment data.
  ============================================================== */

  useEffect(() => {
    /*
      If the user is logged out OR the logged-in user is an admin,
      do not load student enrollments.
    */
    if (!user || profile?.role === "admin") {
      setEnrollments([]);
      setStudentLoading(false);
      return;
    }

    const loadStudentEnrollments = async () => {
      setStudentLoading(true);

      const { data, error } = await supabase
        .from("enrollments")
        .select("*, internships(*)")
        .eq("student_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Failed to load student enrollments:",
          error
        );

        setEnrollments([]);
      } else {
        setEnrollments(
          (data as Enrollment[]) ?? []
        );
      }

      setStudentLoading(false);
    };

    loadStudentEnrollments();
  }, [user, profile]);

  /* ==============================================================
     TODAY
  ============================================================== */

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  /* ==============================================================
     FIND ACTIVE ENROLLMENT
  ============================================================== */

  const activeEnrollmentByInternship = useMemo(() => {
    const map: Record<string, Enrollment> = {};

    for (const enrollment of enrollments) {
      const isActiveDateRange =
        enrollment.start_date <= today &&
        enrollment.end_date >= today;

      const certificateIssued =
        enrollment.status === "certificate_issued";

      if (
        isActiveDateRange &&
        !certificateIssued
      ) {
        map[enrollment.internship_id] = enrollment;
      }
    }

    return map;
  }, [enrollments, today]);

  /* ==============================================================
     START NOW HANDLER
  ============================================================== */

  const handleStartNow = (internship: Internship) => {
    /*
      Admin should never enter the student enrollment flow.
      If an admin clicks Start Now / Open Dashboard,
      send them directly to the Admin Dashboard.
    */
    if (profile?.role === "admin") {
      navigate("/admin/internship");
      return;
    }

    /*
      Logged out user
    */
    if (!user) {
      navigate("/internship/register");
      return;
    }

    /*
      Student with active enrollment
    */
    const activeEnrollment =
      activeEnrollmentByInternship[internship.id];

    if (activeEnrollment) {
      navigate("/internship/dashboard");
      return;
    }

    /*
      Student without active enrollment
    */
    navigate(
      `/internship/enroll/${internship.slug}`
    );
  };

  /* ==============================================================
     RENDER
  ============================================================== */

  return (
    <div className="pt-32 pb-24 max-w-6xl mx-auto px-6">

      {/* ==========================================================
          PAGE HEADER
      ========================================================== */}

      <SectionHeading
        badge="TechDudes Internships"
        title="Online Internship & Certificate Program"
        subtitle="Learn practical skills through structured modules, pass an assessment quiz, and earn a verifiable TechDudes certificate."
      />

      {/* ==========================================================
          TOP STUDENT / AUTH AREA
      ========================================================== */}

      <div className="mb-10">

        {!user ? (

          /* ------------------------------------------------------
             LOGGED OUT
          ------------------------------------------------------ */

          <div
            className={`
              ${glassBox}
              ${glassBoxHover}
              rounded-2xl
              p-6
              relative
              overflow-hidden
            `}
          >

            {/* Soft glass highlight */}

            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-purple-500/[0.06] pointer-events-none" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div>

                <h2 className="text-xl font-semibold text-foreground">
                  Ready to start your internship?
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  Login to your account or create a new student account.
                </p>

              </div>

              <div className="flex flex-wrap gap-3">

                <Button
                  asChild
                  variant="outline"
                  className="
                    bg-white/[0.03]
                    border-white/10
                    backdrop-blur-md
                    hover:bg-white/[0.08]
                    hover:border-white/20
                  "
                >
                  <Link to="/internship/login">
                    Login
                  </Link>
                </Button>

                <Button
                  asChild
                  className="neon-btn"
                >
                  <Link to="/internship/register">
                    Register
                  </Link>
                </Button>

              </div>

            </div>

          </div>

        ) : (

          /* ------------------------------------------------------
             LOGGED IN
          ------------------------------------------------------ */

          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              border border-primary/15
              bg-white/[0.035]
              backdrop-blur-xl
              shadow-[0_8px_32px_rgba(0,0,0,0.18)]
              p-6
              transition-all
              duration-300
              hover:bg-white/[0.05]
              hover:border-primary/25
            "
          >

            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-cyan-500/[0.04] pointer-events-none" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div>

                <div className="flex items-center gap-2">

                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_currentColor]" />

                  <h2 className="text-xl font-semibold text-foreground">
                    You're logged in
                  </h2>

                </div>

                <p className="text-sm text-muted-foreground mt-1">
                  Welcome back,{" "}
                  <strong className="text-foreground">
                    {profile?.full_name ||
                      user.user_metadata?.full_name ||
                      user.email?.split("@")[0] ||
                      "Student"}
                  </strong>
                  .
                </p>

              </div>

              {/* ==================================================
                  ADMIN / STUDENT DASHBOARD BUTTON
              ================================================== */}

              <Button
                asChild
                className="neon-btn"
              >
                <Link
                  to={
                    profile?.role === "admin"
                      ? "/admin/internship"
                      : "/internship/dashboard"
                  }
                >
                  {profile?.role === "admin"
                    ? "View Admin Dashboard"
                    : "View Dashboard"}
                </Link>
              </Button>

            </div>

          </div>

        )}

      </div>

      {/* ==========================================================
          PROGRAM OVERVIEW
      ========================================================== */}

      <div className="grid md:grid-cols-3 gap-6 mb-12">

        <InfoStat
          label="How it works"
          value="Modules → Quiz → Pay → Wait for end date"
        />

        <InfoStat
          label="Certificate"
          value="Issued on your ending date"
        />

        {/* ========================================================
            VERIFICATION CARD
        ======================================================== */}

        <div
          className={`
            ${glassBox}
            ${glassBoxHover}
            rounded-2xl
            p-5
            relative
            overflow-hidden
          `}
        >

          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.05] via-transparent to-primary/[0.05] pointer-events-none" />

          <div className="relative">

            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Verification
            </p>

            <p className="text-foreground font-medium">
              Public link + QR, no login needed
            </p>

            <Button
              asChild
              className="neon-btn mt-4 w-full"
            >
              <Link to="/verify">
                Verify Certificate
              </Link>
            </Button>

          </div>

        </div>

      </div>

      {/* ==========================================================
          AVAILABLE INTERNSHIPS
      ========================================================== */}

      <section>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">

          <div>

            <h3 className="text-2xl font-semibold text-foreground">
              Available Internships
            </h3>

            <p className="text-sm text-muted-foreground mt-1">
              Choose an internship and select your starting date.
            </p>

          </div>

        </div>

        {/* --------------------------------------------------------
            LOADING
        -------------------------------------------------------- */}

        {loading ? (

          <div
            className={`
              ${glassBox}
              rounded-2xl
              py-12
              text-center
            `}
          >
            <p className="text-muted-foreground">
              Loading internships…
            </p>
          </div>

        ) : internships.length === 0 ? (

          /* ------------------------------------------------------
             NO INTERNSHIPS
          ------------------------------------------------------ */

          <Card
            className={`
              ${glassBox}
              ${glassBoxHover}
              rounded-2xl
            `}
          >

            <CardContent className="py-12 text-center">

              <p className="text-muted-foreground">
                No internships are open right now —
                check back soon.
              </p>

            </CardContent>

          </Card>

        ) : (

          /* ------------------------------------------------------
             INTERNSHIP CARDS
          ------------------------------------------------------ */

          <div className="grid md:grid-cols-2 gap-6 mb-16">

            {internships.map((internship) => {

              const activeEnrollment =
                activeEnrollmentByInternship[
                  internship.id
                ];

              const hasActiveEnrollment =
                !!activeEnrollment;

              return (

                <Card
                  key={internship.id}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-2xl
                    border border-white/10
                    bg-white/[0.035]
                    backdrop-blur-xl
                    shadow-[0_8px_32px_rgba(0,0,0,0.2)]
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:bg-white/[0.055]
                    hover:border-white/15
                    hover:shadow-[0_16px_45px_rgba(0,0,0,0.28)]
                  "
                >

                  {/* Glass gradient */}

                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-purple-500/[0.06] pointer-events-none" />

                  {/* Hover glow */}

                  <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/[0.08] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* =================================================
                      CARD HEADER
                  ================================================= */}

                  <CardHeader className="relative">

                    <div className="flex items-start justify-between gap-4">

                      <CardTitle className="text-xl">
                        {internship.title}
                      </CardTitle>

                    </div>

                  </CardHeader>

                  {/* =================================================
                      CARD CONTENT
                  ================================================= */}

                  <CardContent className="relative space-y-5">

                    {/* DESCRIPTION */}

                    <p className="text-muted-foreground">
                      {internship.short_description}
                    </p>

                    {/* PROGRAM DETAILS */}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                      <GlassDetailBox
                        label="Duration"
                        value={`${internship.duration_days} days`}
                      />

                      <GlassDetailBox
                        label="Certificate Fee"
                        value={`₹${(
                          internship.certificate_fee_paise /
                          100
                        ).toFixed(0)}`}
                      />

                      <GlassDetailBox
                        label="Pass Mark"
                        value={`${internship.pass_mark_percent}%`}
                      />

                    </div>

                    {/* =================================================
                        LOGGED-IN ACTIVE STATUS
                    ================================================= */}

                    {user &&
                      profile?.role !== "admin" &&
                      hasActiveEnrollment && (

                        <div
                          className="
                            rounded-xl
                            border border-primary/15
                            bg-primary/[0.04]
                            backdrop-blur-lg
                            p-4
                            shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
                          "
                        >

                          <div className="flex items-center gap-2">

                            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_currentColor]" />

                            <p className="text-sm font-medium text-primary">
                              You are currently enrolled
                            </p>

                          </div>

                          <p className="text-xs text-muted-foreground mt-1">
                            Your active internship is already available
                            from your dashboard.
                          </p>

                        </div>

                      )}

                    {/* =================================================
                        START BUTTON
                    ================================================= */}

                    <div className="pt-1">

                      <Button
                        className="neon-btn"
                        disabled={
                          studentLoading &&
                          profile?.role !== "admin"
                        }
                        onClick={() =>
                          handleStartNow(internship)
                        }
                      >

                        {profile?.role === "admin"
                          ? "View Admin Dashboard"
                          : studentLoading
                          ? "Loading…"
                          : hasActiveEnrollment
                          ? "Open Dashboard"
                          : "Start Now"}

                      </Button>

                    </div>

                  </CardContent>

                </Card>

              );
            })}

          </div>

        )}

      </section>

      {/* ==========================================================
          IMPORTANT INFORMATION
      ========================================================== */}

      <div
        className={`
          ${glassBox}
          ${glassBoxHover}
          rounded-2xl
          p-8
          mb-16
          relative
          overflow-hidden
        `}
      >

        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] via-transparent to-purple-500/[0.04] pointer-events-none" />

        <div className="relative">

          <h3 className="text-xl font-semibold text-foreground mb-4">
            Important: choose your starting date carefully
          </h3>

          <p className="text-muted-foreground">
            Your certificate is generated automatically on the
            internship ending date — not the day you
            finish the modules and quiz. If you complete everything
            early, your certificate will show as{" "}
            <strong className="text-foreground">
              "Scheduled"
            </strong>{" "}
            until ending date arrives.
          </p>

        </div>

      </div>

      {/* ==========================================================
          FAQ
      ========================================================== */}

      <h3 className="text-2xl font-semibold text-foreground mb-6">
        FAQ
      </h3>

      <div className="space-y-4">

        {faqs.map((faq) => (

          <div
            key={faq.q}
            className={`
              ${glassBox}
              ${glassBoxHover}
              rounded-xl
              p-5
              relative
              overflow-hidden
            `}
          >

            <div className="absolute inset-0 bg-gradient-to-r from-white/[0.015] to-primary/[0.02] pointer-events-none" />

            <div className="relative">

              <p className="font-medium text-foreground mb-1">
                {faq.q}
              </p>

              <p className="text-muted-foreground text-sm">
                {faq.a}
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
};

/* ================================================================
   INFO STAT
================================================================ */

const InfoStat = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div
    className="
      group
      relative
      overflow-hidden
      rounded-2xl
      border border-white/10
      bg-white/[0.035]
      backdrop-blur-xl
      shadow-[0_8px_32px_rgba(0,0,0,0.18)]
      p-5
      transition-all
      duration-300
      hover:bg-white/[0.055]
      hover:border-white/15
      hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)]
    "
  >

    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-purple-500/[0.04] pointer-events-none" />

    <div className="relative">

      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
        {label}
      </p>

      <p className="text-foreground font-medium">
        {value}
      </p>

    </div>

  </div>
);

/* ================================================================
   GLASS DETAIL BOX
================================================================ */

const GlassDetailBox = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div
    className="
      rounded-xl
      border border-white/10
      bg-white/[0.025]
      backdrop-blur-lg
      p-4
      transition-all
      duration-300
      hover:bg-white/[0.05]
      hover:border-white/15
    "
  >

    <p className="text-xs uppercase tracking-wide text-muted-foreground">
      {label}
    </p>

    <p className="text-foreground font-medium mt-1">
      {value}
    </p>

  </div>
);

export default InternshipLanding;
