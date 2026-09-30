import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Enrollment,
  Internship,
} from "@/types/internship";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";


/* ================================================================
   DASHBOARD VIEWS
================================================================ */

type DashboardView =
  | "new"
  | "current"
  | "completed";


/* ================================================================
   CURRENT ENROLLMENT CHECK
================================================================ */

/*
 * IMPORTANT:
 *
 * An enrollment is CURRENT only when:
 *
 * start_date <= today
 * AND
 * today <= end_date
 * AND
 * certificate is not issued
 *
 * This SAME function is used by both:
 *
 * 1. Current Internship tab
 * 2. New Internship tab
 *
 * This prevents the two tabs from showing conflicting information.
 */

const isCurrentEnrollment = (
  enrollment: Enrollment,
  today: string
) => {
  return (
    enrollment.end_date >= today &&
    enrollment.status !== "certificate_issued"
  );
};


/* ================================================================
   MAIN DASHBOARD
================================================================ */

const Dashboard = () => {
  const { user, profile, logout } = useAuth();


  /* ==============================================================
     STATE
  ============================================================== */

  const [enrollments, setEnrollments] =
    useState<Enrollment[]>([]);

  const [internships, setInternships] =
    useState<Internship[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [internshipsLoading, setInternshipsLoading] =
    useState(false);

  const [progressByEnrollment, setProgressByEnrollment] =
    useState<Record<string, number>>({});

  /*
   * Default tab
   *
   * When dashboard opens, show Current Internship.
   */

  const [view, setView] =
    useState<DashboardView>("current");


  /* ==============================================================
     TODAY
  ============================================================== */

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);


  /* ==============================================================
     LOAD STUDENT ENROLLMENTS
  ============================================================== */

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("enrollments")
        .select("*, internships(*)")
        .eq("student_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Failed to load enrollments:",
          error
        );

        setEnrollments([]);
        setProgressByEnrollment({});
        setLoading(false);

        return;
      }

      const enrollmentList =
        (data as Enrollment[]) ?? [];

      setEnrollments(
        enrollmentList
      );


      /* ------------------------------------------------------------
         LOAD MODULE PROGRESS
      ------------------------------------------------------------ */

      const progressMap: Record<string, number> = {};

      await Promise.all(
        enrollmentList.map(async (enrollment) => {

          /* Total modules */

          const { count: total } =
            await supabase
              .from("modules")
              .select("*", {
                count: "exact",
                head: true,
              })
              .eq(
                "internship_id",
                enrollment.internship_id
              );


          /* Completed modules */

          const { count: done } =
            await supabase
              .from("module_progress")
              .select("*", {
                count: "exact",
                head: true,
              })
              .eq(
                "enrollment_id",
                enrollment.id
              )
              .eq(
                "completed",
                true
              );


          /* Calculate percentage */

          progressMap[enrollment.id] =
            total
              ? Math.round(
                  ((done ?? 0) / total) *
                    100
                )
              : 0;
        })
      );


      setProgressByEnrollment(
        progressMap
      );

      setLoading(false);
    };


    loadDashboard();
  }, [user]);


  /* ==============================================================
     LOAD AVAILABLE INTERNSHIPS
  ============================================================== */

  useEffect(() => {
    const loadInternships = async () => {
      setInternshipsLoading(true);

      const { data, error } =
        await supabase
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

      setInternshipsLoading(false);
    };


    loadInternships();
  }, []);


  /* ==============================================================
     CURRENT INTERNSHIPS
  ============================================================== */

  const currentInternships =
    useMemo(() => {

      return enrollments.filter(
        (enrollment) =>
          isCurrentEnrollment(
            enrollment,
            today
          )
      );

    }, [
      enrollments,
      today,
    ]);


  /* ==============================================================
     COMPLETED INTERNSHIPS
  ============================================================== */

  /*
   * An internship is completed when:
   *
   * 1. Certificate has been issued
   *
   * OR
   *
   * 2. End date has already passed
   *
   * NOTE:
   *
   * end_date < today
   *
   * is intentionally used here.
   *
   * This prevents an internship ending TODAY
   * from appearing in both Current and Completed.
   */

  const completedInternships =
    useMemo(() => {

      return enrollments.filter(
        (enrollment) => {

          const certificateIssued =
            enrollment.status ===
            "certificate_issued";

          const endDatePassed =
            enrollment.end_date < today;

          return (
            certificateIssued ||
            endDatePassed
          );
        }
      );

    }, [
      enrollments,
      today,
    ]);


  /* ==============================================================
     RENDER
  ============================================================== */

  return (
    <div className="pt-32 pb-24 max-w-6xl mx-auto px-6">


      {/* ==========================================================
          HEADER
      ========================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>

          <h1 className="text-3xl font-bold text-foreground">

            Welcome,{" "}

            {profile?.full_name ??
              "Student"}

          </h1>


          <p className="text-muted-foreground mt-1">

            Manage your internships,
            certificates and learning
            progress.

          </p>

        </div>


        <Button
          variant="outline"
          onClick={logout}
        >
          Logout
        </Button>

      </div>


      {/* ==========================================================
          DASHBOARD TABS
      ========================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">


        {/* ========================================================
            NEW INTERNSHIP
        ======================================================== */}

        <Button
          variant={
            view === "new"
              ? "default"
              : "outline"
          }
          className="h-14"
          onClick={() =>
            setView("new")
          }
        >

          <span className="mr-2 text-lg">
            +
          </span>

          New Internship

        </Button>


        {/* ========================================================
            CURRENT INTERNSHIP
        ======================================================== */}

        <Button
          variant={
            view === "current"
              ? "default"
              : "outline"
          }
          className="h-14"
          onClick={() =>
            setView("current")
          }
        >

          Current Internship

        </Button>


        {/* ========================================================
            COMPLETED
        ======================================================== */}

        <Button
          variant={
            view === "completed"
              ? "default"
              : "outline"
          }
          className="h-14"
          onClick={() =>
            setView("completed")
          }
        >

          Completed

        </Button>


        {/* ========================================================
            VERIFY CERTIFICATE
        ======================================================== */}

        <Button
          asChild
          variant="outline"
          className="h-14"
        >

          <Link to="/verify">

            Verify Certificate

          </Link>

        </Button>

      </div>


      {/* ==========================================================
          MAIN LOADING
      ========================================================== */}

      {loading && (

        <Card className="border-glass-border bg-glass/40 backdrop-blur">

          <CardContent className="py-12 text-center">

            <p className="text-muted-foreground">

              Loading your internship
              dashboard…

            </p>

          </CardContent>

        </Card>
      )}


      {/* ==========================================================
          NO ENROLLMENTS
      ========================================================== */}

      {!loading &&
        enrollments.length === 0 &&
        view !== "new" && (

          <Card className="border-glass-border bg-glass/40 backdrop-blur">

            <CardContent className="py-14 text-center space-y-5">

              <div>

                <h2 className="text-xl font-semibold text-foreground">

                  No internships yet

                </h2>


                <p className="text-muted-foreground mt-2">

                  You haven't enrolled in
                  an internship yet.

                </p>

              </div>


              <Button
                className="neon-btn"
                onClick={() =>
                  setView("new")
                }
              >

                Browse Internships

              </Button>

            </CardContent>

          </Card>
      )}


      {/* ==========================================================
          ==========================================================
          NEW INTERNSHIP
          ==========================================================
      ========================================================== */}

      {!loading &&
        view === "new" && (

          <section>


            {/* ------------------------------------------------------
                HEADER
            ------------------------------------------------------ */}

            <div className="mb-6">

              <h2 className="text-2xl font-bold text-foreground">

                Available Internships

              </h2>


              <p className="text-sm text-muted-foreground mt-1">

                Choose an internship and
                start your learning journey.

              </p>

            </div>


            {/* ------------------------------------------------------
                LOADING
            ------------------------------------------------------ */}

            {internshipsLoading ? (

              <Card className="border-glass-border bg-glass/40 backdrop-blur">

                <CardContent className="py-12 text-center">

                  <p className="text-muted-foreground">

                    Loading available
                    internships…

                  </p>

                </CardContent>

              </Card>

            ) : internships.length === 0 ? (

              /* ----------------------------------------------------
                 NO AVAILABLE INTERNSHIPS
              ---------------------------------------------------- */

              <Card className="border-glass-border bg-glass/40 backdrop-blur">

                <CardContent className="py-12 text-center">

                  <p className="text-muted-foreground">

                    No internships are
                    available right now.

                  </p>

                </CardContent>

              </Card>

            ) : (

              /* ----------------------------------------------------
                 AVAILABLE INTERNSHIP CARDS
              ---------------------------------------------------- */

              <div className="grid md:grid-cols-2 gap-6">


                {internships.map(
                  (internship) => {

                    /*
                     * IMPORTANT:
                     *
                     * Use the SAME current-enrollment
                     * function used by the Current tab.
                     */

                    const alreadyEnrolled =
                      enrollments.some(
                        (enrollment) =>
                          enrollment.internship_id ===
                            internship.id &&
                          isCurrentEnrollment(
                            enrollment,
                            today
                          )
                      );


                    return (

                      <Card
                        key={internship.id}
                        className="border-glass-border bg-glass/40 backdrop-blur"
                      >


                        {/* =================================================
                            CARD HEADER
                        ================================================= */}

                        <CardHeader>

                          <CardTitle className="text-xl">

                            {internship.title}

                          </CardTitle>

                        </CardHeader>


                        {/* =================================================
                            CARD CONTENT
                        ================================================= */}

                        <CardContent className="space-y-5">


                          {/* ------------------------------------------------
                              DESCRIPTION
                          ------------------------------------------------ */}

                          <p className="text-muted-foreground">

                            {
                              internship.short_description
                            }

                          </p>


                          {/* ------------------------------------------------
                              DETAILS
                          ------------------------------------------------ */}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">


                            {/* DURATION */}

                            <div className="rounded-xl border border-glass-border bg-glass/20 p-4">

                              <p className="text-xs uppercase tracking-wide text-muted-foreground">

                                Duration

                              </p>


                              <p className="text-foreground font-medium mt-1">

                                {
                                  internship.duration_days
                                }{" "}

                                days

                              </p>

                            </div>


                            {/* CERTIFICATE FEE */}

                            <div className="rounded-xl border border-glass-border bg-glass/20 p-4">

                              <p className="text-xs uppercase tracking-wide text-muted-foreground">

                                Certificate Fee

                              </p>


                              <p className="text-foreground font-medium mt-1">

                                ₹
                                {(
                                  internship.certificate_fee_paise /
                                  100
                                ).toFixed(0)}

                              </p>

                            </div>


                            {/* PASS MARK */}

                            <div className="rounded-xl border border-glass-border bg-glass/20 p-4">

                              <p className="text-xs uppercase tracking-wide text-muted-foreground">

                                Pass Mark

                              </p>


                              <p className="text-foreground font-medium mt-1">

                                {
                                  internship.pass_mark_percent
                                }%

                              </p>

                            </div>

                          </div>


                          {/* =================================================
                              ALREADY CURRENTLY ENROLLED
                          ================================================= */}

                          {alreadyEnrolled ? (

                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">


                              <p className="text-sm font-medium text-primary">

                                You already have
                                an active
                                internship.

                              </p>


                              <p className="text-xs text-muted-foreground mt-1">

                                Continue your
                                current
                                internship from
                                the Current
                                Internship tab.

                              </p>

                            </div>

                          ) : (

                            /* ==============================================
                               START BUTTON
                            ============================================== */

                            <Button
                              asChild
                              className="neon-btn"
                            >

                              <Link
                                to={`/internship/enroll/${internship.slug}`}
                              >

                                Start

                              </Link>

                            </Button>

                          )}

                        </CardContent>

                      </Card>

                    );
                  }
                )}

              </div>

            )}

          </section>
      )}


      {/* ==========================================================
          ==========================================================
          CURRENT INTERNSHIP
          ==========================================================
      ========================================================== */}

      {!loading &&
        view === "current" && (

          <section>


            {/* ------------------------------------------------------
                HEADER
            ------------------------------------------------------ */}

            <div className="mb-6">

              <h2 className="text-2xl font-bold text-foreground">

                Current Internship

              </h2>


              <p className="text-sm text-muted-foreground mt-1">

                Your enrolled and active
                internship.

              </p>

            </div>


            {/* ------------------------------------------------------
                NO CURRENT INTERNSHIP
            ------------------------------------------------------ */}

            {currentInternships.length ===
            0 ? (

              <Card className="border-glass-border bg-glass/40 backdrop-blur">

                <CardContent className="py-12 text-center space-y-5">


                  <div>

                    <h3 className="text-xl font-semibold text-foreground">

                      No Current Internship

                    </h3>


                    <p className="text-muted-foreground mt-2">

                      You don't have an
                      enrolled internship
                      right now.

                    </p>

                  </div>


                  <Button
                    className="neon-btn"
                    onClick={() =>
                      setView("new")
                    }
                  >

                    Start New Internship

                  </Button>

                </CardContent>

              </Card>

            ) : (

              /* ----------------------------------------------------
                 CURRENT INTERNSHIPS
              ---------------------------------------------------- */

              <div className="space-y-6">

                {currentInternships.map(
                  (enrollment) => (

                    <InternshipCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      progress={
                        progressByEnrollment[
                          enrollment.id
                        ] ?? 0
                      }
                      today={today}
                      current
                    />

                  )
                )}

              </div>

            )}

          </section>
      )}


      {/* ==========================================================
          ==========================================================
          COMPLETED INTERNSHIPS
          ==========================================================
      ========================================================== */}

      {!loading &&
        view === "completed" && (

          <section>


            {/* ------------------------------------------------------
                HEADER
            ------------------------------------------------------ */}

            <div className="mb-6">

              <h2 className="text-2xl font-bold text-foreground">

                Completed Internships

              </h2>


              <p className="text-sm text-muted-foreground mt-1">

                Your previous internships
                and certificates.

              </p>

            </div>


            {/* ------------------------------------------------------
                NO COMPLETED INTERNSHIPS
            ------------------------------------------------------ */}

            {completedInternships.length ===
            0 ? (

              <Card className="border-glass-border bg-glass/40 backdrop-blur">

                <CardContent className="py-12 text-center space-y-5">


                  <div>

                    <h3 className="text-xl font-semibold text-foreground">

                      No Completed
                      Internships

                    </h3>


                    <p className="text-muted-foreground mt-2">

                      You haven't completed
                      an internship yet.

                    </p>

                  </div>


                  <Button
                    className="neon-btn"
                    onClick={() =>
                      setView("new")
                    }
                  >

                    Start New Internship

                  </Button>

                </CardContent>

              </Card>

            ) : (

              /* ----------------------------------------------------
                 COMPLETED INTERNSHIPS
              ---------------------------------------------------- */

              <div className="space-y-6">

                {completedInternships.map(
                  (enrollment) => (

                    <InternshipCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      progress={
                        progressByEnrollment[
                          enrollment.id
                        ] ?? 0
                      }
                      today={today}
                      current={false}
                    />

                  )
                )}

              </div>

            )}

          </section>
      )}

    </div>
  );
};


/* =================================================================
   INTERNSHIP CARD
================================================================= */

const InternshipCard = ({
  enrollment,
  progress,
  today,
  current,
}: {
  enrollment: Enrollment;
  progress: number;
  today: string;
  current: boolean;
}) => {

  const e = enrollment;


  /* ===============================================================
     CERTIFICATE ELIGIBILITY
  =============================================================== */

  const certEligible =
    e.modules_completed &&
    e.quiz_passed &&
    e.payment_verified;


  /* ===============================================================
     CERTIFICATE ISSUED
  =============================================================== */

  const certIssued =
    e.status === "certificate_issued";


  /* ===============================================================
     END DATE REACHED
  =============================================================== */

  const endReached =
    e.end_date <= today;


  /* ===============================================================
     CERTIFICATE STATUS
  =============================================================== */

  let certificateStatus =
    "Not eligible yet";


  if (certIssued) {

    certificateStatus =
      "Issued";

  } else if (
    certEligible &&
    endReached
  ) {

    certificateStatus =
      "Generating…";

  } else if (certEligible) {

    certificateStatus =
      "Scheduled";

  }


  /* ===============================================================
     RENDER
  =============================================================== */

  return (

    <Card className="border-glass-border bg-glass/40 backdrop-blur">


      {/* ==========================================================
          HEADER
      ========================================================== */}

      <CardHeader>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">

          <div>

            <CardTitle>

              {e.internships?.title}

            </CardTitle>


            {/* CURRENT BADGE */}

            {current && (

              <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">

                Current Internship

              </span>

            )}


            {/* COMPLETED BADGE */}

            {!current && (

              <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border border-glass-border">

                Completed

              </span>

            )}

          </div>

        </div>

      </CardHeader>


      {/* ==========================================================
          CONTENT
      ========================================================== */}

      <CardContent className="space-y-5">


        {/* ========================================================
            BASIC INFORMATION
        ======================================================== */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">


          <Info
            label="Starting date"
            value={e.start_date}
          />


          <Info
            label="Ending date"
            value={e.end_date}
          />


          <Info
            label="Duration"
            value={`${e.duration_days} days`}
          />


          <Info
            label="Quiz"
            value={
              e.quiz_passed
                ? "Passed"
                : e.quiz_score !== null
                ? "Not passed"
                : "Not attempted"
            }
          />

        </div>


        {/* ========================================================
            START DATE STATUS
        ======================================================== */}

        {e.start_date > today && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-primary">
              Internship starts on {e.start_date}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your internship is enrolled successfully. The modules will
              unlock on your selected starting date.
            </p>
          </div>
        )}

        {/* ========================================================
            MODULE PROGRESS
        ======================================================== */}

        <div>

          <div className="flex justify-between text-sm mb-2">

            <span className="text-muted-foreground">

              Module progress

            </span>


            <span className="text-foreground font-medium">

              {progress}%

            </span>

          </div>


          <Progress
            value={progress}
          />

        </div>


        {/* ========================================================
            PAYMENT + CERTIFICATE
        ======================================================== */}

        <div className="grid grid-cols-2 gap-4 text-sm">


          <Info
            label="Payment"
            value={
              e.payment_verified
                ? "Verified"
                : "Pending"
            }
          />


          <Info
            label="Certificate"
            value={
              certificateStatus
            }
          />

        </div>


        {/* ========================================================
            CERTIFICATE SCHEDULE
        ======================================================== */}

        {certEligible &&
          !certIssued && (

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">

              <p className="text-sm text-muted-foreground">

                Course completed
                successfully.

              </p>


              <p className="text-sm text-foreground mt-1">

                Certificate issue date:{" "}

                <strong>

                  {e.end_date}

                </strong>

              </p>


              <p className="text-sm text-primary mt-1">

                Certificate Status:
                Scheduled

              </p>

            </div>

          )}


        {/* ========================================================
            ACTIONS
        ======================================================== */}

        <div className="flex flex-wrap gap-3 pt-2">

          {/* ======================================================
              VIEW MODULES
              Always available for the current internship.
          ====================================================== */}

          {current && (
            <Button
              asChild
              className="neon-btn"
            >
              <Link to={`/internship/modules/${e.id}`}>
                View Modules
              </Link>
            </Button>
          )}

          {/* ======================================================
              FINAL ASSESSMENT
              Appears ONLY when:
              1. This is the current internship
              2. All modules are completed
              3. Server says modules_completed = true
              4. Final assessment has not already been passed
          ====================================================== */}

          {current &&
            progress === 100 &&
            e.modules_completed &&
            !e.quiz_passed && (
              <Button
                asChild
                className="neon-btn"
              >
                <Link to={`/internship/quiz/${e.id}`}>
                  Take Final Assessment
                </Link>
              </Button>
            )}

          {/* ======================================================
              PAYMENT
          ====================================================== */}

          {e.modules_completed &&
            e.quiz_passed &&
            !e.payment_verified && (
              <Button
                asChild
                className="neon-btn"
              >
                <Link to={`/internship/pay/${e.id}`}>
                  Pay Certificate Fee
                </Link>
              </Button>
            )}

          {/* ======================================================
              CERTIFICATE
          ====================================================== */}

          {certIssued && (
            <Button
              asChild
              className="neon-btn"
            >
              <Link
                to={`/internship/certificate/${e.id}`}
              >
                View Certificate
              </Link>
            </Button>
          )}

        </div>

      </CardContent>

    </Card>
  );
};


/* =================================================================
   INFO COMPONENT
================================================================= */

const Info = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (

  <div>

    <p className="text-xs uppercase tracking-wide text-muted-foreground">

      {label}

    </p>


    <p className="text-foreground mt-1">

      {value}

    </p>

  </div>
);


export default Dashboard;