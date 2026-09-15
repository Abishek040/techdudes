import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { supabase } from "@/lib/supabaseClient";

import type {
  ModuleRow,
  Enrollment,
} from "@/types/internship";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  CheckCircle2,
  Circle,
  Lock,
  BookOpen,
  ClipboardCheck,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import useInternshipBackToDashboard from "@/hooks/useInternshipBackToDashboard";

/* ============================================================
   HELPERS
============================================================ */

const getIndiaToday = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
};

const formatDate = (date: string) => {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

/* ============================================================
   TYPES
============================================================ */

type ModuleQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  order_index: number;
};

type ModuleQuizResult = {
  score: number;
  total: number;
  percent: number;
  passed: boolean;
};

/* ============================================================
   COMPONENT
============================================================ */

const Modules = () => {
  const {
    enrollmentId,
    moduleId,
  } = useParams();

  const navigate = useNavigate();

  useInternshipBackToDashboard();

  /* ==========================================================
     ENROLLMENT / MODULE STATE
  ========================================================== */

  const [
    enrollment,
    setEnrollment,
  ] = useState<Enrollment | null>(
    null
  );

  const [
    modules,
    setModules,
  ] = useState<ModuleRow[]>([]);

  const [
    completedIds,
    setCompletedIds,
  ] = useState<Set<string>>(
    new Set()
  );

  /* ==========================================================
     PAGE STATE
  ========================================================== */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    marking,
    setMarking,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  /* ==========================================================
     MODULE QUIZ STATE
  ========================================================== */

  const [
    contentFinished,
    setContentFinished,
  ] = useState(false);

  const [
    quizStarted,
    setQuizStarted,
  ] = useState(false);

  const [
    quizLoading,
    setQuizLoading,
  ] = useState(false);

  const [
    quizQuestions,
    setQuizQuestions,
  ] = useState<
    ModuleQuizQuestion[]
  >([]);

  const [
    questionIndex,
    setQuestionIndex,
  ] = useState(0);

  const [
    selectedAnswer,
    setSelectedAnswer,
  ] = useState<number | null>(
    null
  );

  const [
    answers,
    setAnswers,
  ] = useState<
    {
      question_id: string;
      selected: number;
    }[]
  >([]);

  const [
    submittingAnswer,
    setSubmittingAnswer,
  ] = useState(false);

  const [
    quizFinished,
    setQuizFinished,
  ] = useState(false);

  const [
    quizResult,
    setQuizResult,
  ] = useState<
    ModuleQuizResult | null
  >(null);

  /* ==========================================================
     CURRENT DATE
  ========================================================== */

  const today = getIndiaToday();

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  const load = async () => {
    if (!enrollmentId) {
      setError(
        "Invalid enrollment."
      );

      setLoading(false);

      return;
    }

    setLoading(true);
    setError(null);

    /* --------------------------------------------------------
       1. Load enrollment
    -------------------------------------------------------- */

    const {
      data: enr,
      error: enrollmentError,
    } = await supabase
      .from("enrollments")
      .select("*")
      .eq("id", enrollmentId)
      .single();

    if (
      enrollmentError ||
      !enr
    ) {
      setError(
        enrollmentError?.message ||
          "Unable to load your internship."
      );

      setLoading(false);

      return;
    }

    const loadedEnrollment =
      enr as Enrollment;

    setEnrollment(
      loadedEnrollment
    );

    /* --------------------------------------------------------
       2. Start-date protection
    -------------------------------------------------------- */

    const internshipNotStarted =
      today <
      loadedEnrollment.start_date;

    if (
      internshipNotStarted
    ) {
      setModules([]);

      setCompletedIds(
        new Set()
      );

      setLoading(false);

      return;
    }

    /* --------------------------------------------------------
       3. Load modules
    -------------------------------------------------------- */

    const {
      data: mods,
      error: modulesError,
    } = await supabase
      .from("modules")
      .select("*")
      .eq(
        "internship_id",
        loadedEnrollment.internship_id
      )
      .order("order_index");

    if (modulesError) {
      setError(
        modulesError.message
      );

      setLoading(false);

      return;
    }

    setModules(
      (mods as ModuleRow[]) ?? []
    );

    /* --------------------------------------------------------
       4. Load module progress
    -------------------------------------------------------- */

    const {
      data: progress,
      error: progressError,
    } = await supabase
      .from("module_progress")
      .select(
        "module_id, completed"
      )
      .eq(
        "enrollment_id",
        enrollmentId
      )
      .eq(
        "completed",
        true
      );

    if (progressError) {
      setError(
        progressError.message
      );

      setLoading(false);

      return;
    }

    setCompletedIds(
      new Set(
        (progress ?? []).map(
          (p) => p.module_id
        )
      )
    );

    setLoading(false);
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId]);

  /* ==========================================================
     RESET QUIZ WHEN MODULE CHANGES
  ========================================================== */

  useEffect(() => {
    setContentFinished(false);

    setQuizStarted(false);

    setQuizLoading(false);

    setQuizQuestions([]);

    setQuestionIndex(0);

    setSelectedAnswer(null);

    setAnswers([]);

    setSubmittingAnswer(false);

    setQuizFinished(false);

    setQuizResult(null);

    setError(null);
  }, [moduleId]);

  /* ==========================================================
     COPY PROTECTION
  ========================================================== */

  useEffect(() => {
    const preventCopy = (
      event: ClipboardEvent
    ) => {
      const target =
        event.target as HTMLElement | null;

      if (
        target?.closest(
          "[data-module-quiz]"
        )
      ) {
        event.preventDefault();
      }
    };

    const preventContextMenu = (
      event: MouseEvent
    ) => {
      const target =
        event.target as HTMLElement | null;

      if (
        target?.closest(
          "[data-module-quiz]"
        )
      ) {
        event.preventDefault();
      }
    };

    const preventDrag = (
      event: DragEvent
    ) => {
      const target =
        event.target as HTMLElement | null;

      if (
        target?.closest(
          "[data-module-quiz]"
        )
      ) {
        event.preventDefault();
      }
    };

    const preventKeyboardShortcuts = (
      event: KeyboardEvent
    ) => {
      const target =
        event.target as HTMLElement | null;

      if (
        !target?.closest(
          "[data-module-quiz]"
        )
      ) {
        return;
      }

      const key =
        event.key.toLowerCase();

      const blocked =
        (event.ctrlKey ||
          event.metaKey) &&
        [
          "c",
          "x",
          "a",
          "s",
          "u",
        ].includes(key);

      if (blocked) {
        event.preventDefault();
      }

      if (
        event.key ===
          "PrintScreen" ||
        (event.ctrlKey &&
          event.shiftKey &&
          key === "i")
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener(
      "copy",
      preventCopy
    );

    document.addEventListener(
      "cut",
      preventCopy
    );

    document.addEventListener(
      "contextmenu",
      preventContextMenu
    );

    document.addEventListener(
      "dragstart",
      preventDrag
    );

    document.addEventListener(
      "keydown",
      preventKeyboardShortcuts
    );

    return () => {
      document.removeEventListener(
        "copy",
        preventCopy
      );

      document.removeEventListener(
        "cut",
        preventCopy
      );

      document.removeEventListener(
        "contextmenu",
        preventContextMenu
      );

      document.removeEventListener(
        "dragstart",
        preventDrag
      );

      document.removeEventListener(
        "keydown",
        preventKeyboardShortcuts
      );
    };
  }, []);

  /* ==========================================================
     LOAD MODULE QUIZ
  ========================================================== */

  const loadModuleQuiz = async () => {
    if (
      !enrollmentId ||
      !current
    ) {
      return;
    }

    setQuizLoading(true);
    setError(null);

    const {
      data,
      error: quizError,
    } = await supabase.rpc(
      "get_module_quiz_questions",
      {
        p_enrollment_id:
          enrollmentId,

        p_module_id:
          current.id,
      }
    );

    setQuizLoading(false);

    if (quizError) {
      setError(
        quizError.message
      );

      return;
    }

    const questions =
      ((data ?? []) as any[])
        .map((question) => ({
          id: question.id,
          question:
            question.question,
          options:
            Array.isArray(
              question.options
            )
              ? question.options
              : [],
          order_index:
            question.order_index,
        }))
        .sort(
          (a, b) =>
            a.order_index -
            b.order_index
        );

    setQuizQuestions(
      questions
    );
  };

  /* ==========================================================
     MARK CONTENT AS FINISHED
  ========================================================== */

  const markContentFinished =
    () => {
      setError(null);

      setContentFinished(
        true
      );
    };

  /* ==========================================================
     START QUIZ
  ========================================================== */

  const startQuiz = async () => {
    if (
      !current ||
      !enrollmentId
    ) {
      return;
    }

    setError(null);

    setQuizLoading(true);

    const {
      data,
      error: quizError,
    } = await supabase.rpc(
      "get_module_quiz_questions",
      {
        p_enrollment_id:
          enrollmentId,

        p_module_id:
          current.id,
      }
    );

    setQuizLoading(false);

    if (quizError) {
      setError(
        quizError.message
      );

      return;
    }

    const questions =
      ((data ?? []) as any[])
        .map((question) => ({
          id: question.id,
          question:
            question.question,
          options:
            Array.isArray(
              question.options
            )
              ? question.options
              : [],
          order_index:
            question.order_index,
        }))
        .sort(
          (a, b) =>
            a.order_index -
            b.order_index
        );

    /* --------------------------------------------------------
       Quiz must contain 3–5 questions
    -------------------------------------------------------- */

    if (
      questions.length < 3
    ) {
      setError(
        "This module quiz is not ready yet. At least 3 questions are required."
      );

      return;
    }

    if (
      questions.length > 5
    ) {
      setError(
        "This module quiz has more than 5 questions. Please contact the administrator."
      );

      return;
    }

    setQuizQuestions(
      questions
    );

    setQuestionIndex(0);

    setSelectedAnswer(
      null
    );

    setAnswers([]);

    setQuizFinished(false);

    setQuizResult(null);

    setQuizStarted(true);
  };

  /* ==========================================================
     SUBMIT CURRENT QUESTION
  ========================================================== */

  const submitCurrentAnswer =
    async () => {
      if (
        !enrollmentId ||
        !current ||
        !currentQuestion
      ) {
        return;
      }

      if (
        selectedAnswer ===
        null
      ) {
        setError(
          "Please select an answer."
        );

        return;
      }

      setSubmittingAnswer(
        true
      );

      setError(null);

      const nextAnswers = [
        ...answers,
        {
          question_id:
            currentQuestion.id,

          selected:
            selectedAnswer + 1,
        },
      ];

      /*
       * selectedAnswer is zero-based in React.
       *
       * Database correct_option is 1-based:
       *
       * 1 = option 1
       * 2 = option 2
       * 3 = option 3
       * 4 = option 4
       */

      setAnswers(
        nextAnswers
      );

      const isLastQuestion =
        questionIndex >=
        quizQuestions.length - 1;

      if (!isLastQuestion) {
        setQuestionIndex(
          (previous) =>
            previous + 1
        );

        setSelectedAnswer(
          null
        );

        setSubmittingAnswer(
          false
        );

        return;
      }

      /* ------------------------------------------------------
         FINAL QUESTION
      ------------------------------------------------------ */

      const {
        data,
        error:
          submitError,
      } = await supabase.rpc(
        "submit_module_quiz",
        {
          p_enrollment_id:
            enrollmentId,

          p_module_id:
            current.id,

          p_answers:
            nextAnswers,
        }
      );

      setSubmittingAnswer(
        false
      );

      if (submitError) {
        setError(
          submitError.message
        );

        return;
      }

      const rawResult =
        Array.isArray(data)
          ? data[0]
          : data;

      if (!rawResult) {
        setError(
          "Unable to calculate quiz result."
        );

        return;
      }

      const result: ModuleQuizResult =
        {
          score: Number(
            rawResult.score
          ),

          total: Number(
            rawResult.total
          ),

          percent: Number(
            rawResult.percent
          ),

          passed:
            Boolean(
              rawResult.passed
            ),
        };

      setQuizResult(
        result
      );

      setQuizFinished(
        true
      );

      /*
       * Only the server marks the module
       * as completed after a PASS.
       */

      if (result.passed) {
        await load();
      }
    };

  /* ==========================================================
     RETRY QUIZ
  ========================================================== */

  const retryQuiz = () => {
    setError(null);

    setQuizStarted(true);

    setQuestionIndex(0);

    setSelectedAnswer(null);

    setAnswers([]);

    setQuizFinished(false);

    setQuizResult(null);
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="pt-32 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  /* ==========================================================
     ERROR WITHOUT ENROLLMENT
  ========================================================== */

  if (
    error &&
    !enrollment
  ) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-glass-border bg-glass/40 backdrop-blur">
            <CardContent className="py-10 text-center">
              <p className="text-destructive mb-6">
                {error}
              </p>

              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    "/internship/dashboard"
                  )
                }
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ==========================================================
     NO ENROLLMENT
  ========================================================== */

  if (!enrollment) {
    return (
      <div className="pt-32 text-center text-muted-foreground">
        Unable to load internship.
      </div>
    );
  }

  /* ==========================================================
     START DATE LOCK
  ========================================================== */

  const internshipNotStarted =
    today <
    enrollment.start_date;

  if (
    internshipNotStarted
  ) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20 bg-background/80 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-8 w-8 text-primary" />
              </div>

              <CardTitle className="text-2xl">
                Your Internship Has Not Started Yet
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center space-y-5">
              <p className="text-muted-foreground">
                Your internship course
                content is currently
                locked.
              </p>

              <div className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-5">
                <p className="text-sm text-muted-foreground mb-2">
                  Course access begins
                  on
                </p>

                <p className="text-xl font-semibold text-primary">
                  {formatDate(
                    enrollment.start_date
                  )}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                On your starting date,
                you will automatically
                be able to access your
                learning modules and
                continue your internship.
              </p>

              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    "/internship/dashboard"
                  )
                }
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ==========================================================
     CURRENT MODULE
  ========================================================== */

  const current =
    moduleId
      ? modules.find(
          (m) =>
            m.id === moduleId
        )
      : null;

  const doneCount =
    completedIds.size;

  /* ==========================================================
     MODULE LIST
  ========================================================== */

  if (!current) {
    return (
      <div className="pt-32 pb-24 max-w-3xl mx-auto px-6">
        {/* ==================================================
            PAGE HEADER / DASHBOARD NAVIGATION
        ================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Learning Modules
            </h1>

            <p className="text-muted-foreground">
              {doneCount} / {modules.length} modules completed
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              navigate("/internship/dashboard", {
                replace: true,
              })
            }
          >
            ← Back to Dashboard
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {modules.length === 0 ? (
          <Card className="border-glass-border bg-glass/30">
            <CardContent className="py-10 text-center">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />

              <p className="text-muted-foreground">
                No learning modules are available yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ==================================================
                MODULE LIST
            ================================================== */}

            <div className="space-y-3">
              {modules.map((module, index) => {
                const done = completedIds.has(module.id);

                return (
                  <Card
                    key={module.id}
                    className="border-glass-border bg-glass/30 hover:bg-glass/50 transition"
                  >
                    <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
                      <div className="min-w-0 pr-2">
                        <p className="text-foreground font-medium">
                          Module {index + 1} — {module.title}
                        </p>

                        <p className="text-muted-foreground text-sm mt-1">
                          {module.description}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          {done ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-primary" />

                              <span className="text-primary text-sm">
                                Completed
                              </span>
                            </>
                          ) : (
                            <>
                              <Circle className="h-4 w-4 text-muted-foreground" />

                              <span className="text-muted-foreground text-sm">
                                Not completed
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <Button
                        asChild
                        variant={done ? "outline" : "default"}
                        className="shrink-0"
                      >
                        <Link
                          to={`/internship/modules/${enrollmentId}/${module.id}`}
                          replace
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Module
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* ==================================================
                FINAL ASSESSMENT
                ONLY AFTER ALL MODULES ARE COMPLETED
            ================================================== */}

            {modules.length > 0 &&
              doneCount === modules.length && (
                <div className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-6">
                  <div className="text-center">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-primary mb-3" />

                    <p className="text-sm text-primary font-medium">
                      ALL MODULES COMPLETED
                    </p>

                    <h2 className="text-xl font-semibold text-foreground mt-1">
                      You have completed all {modules.length} modules
                    </h2>

                    <p className="text-sm text-muted-foreground mt-2">
                      Your 15-question Final Assessment is now available.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate("/internship/dashboard", {
                          replace: true,
                        })
                      }
                    >
                      ← Back to Dashboard
                    </Button>

                    <Button
                      className="neon-btn"
                      onClick={() =>
                        navigate(`/internship/quiz/${enrollmentId}`, {
                          replace: true,
                        })
                      }
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Take Final Assessment
                    </Button>
                  </div>
                </div>
              )}
          </>
        )}
      </div>
    );
  }

  /* ==========================================================
     CURRENT MODULE INDEX
  ========================================================== */

  const idx =
    modules.findIndex(
      (m) =>
        m.id === current.id
    );

  const prev =
    modules[idx - 1];

  const next =
    modules[idx + 1];

  const done =
    completedIds.has(
      current.id
    );

  /* ==========================================================
     CURRENT QUESTION
  ========================================================== */

  const currentQuestion =
    quizQuestions[
      questionIndex
    ];

  /* ==========================================================
     QUIZ RESULT VIEW
  ========================================================== */

  if (
    quizStarted &&
    quizFinished &&
    quizResult
  ) {
    return (
      <div className="pt-32 pb-24 max-w-3xl mx-auto px-6">
        <Link
          to={`/internship/modules/${enrollmentId}`}
          replace
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All modules
        </Link>

        <Card className="border-glass-border bg-glass/40 backdrop-blur mt-4">
          <CardContent className="py-12 text-center">
            {quizResult.passed ? (
              <>
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>

                <h1 className="text-3xl font-bold">
                  Module Quiz Passed!
                </h1>

                <p className="text-muted-foreground mt-3">
                  You successfully
                  completed this
                  module.
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                  <RotateCcw className="h-10 w-10 text-destructive" />
                </div>

                <h1 className="text-3xl font-bold">
                  Quiz Not Passed
                </h1>

                <p className="text-muted-foreground mt-3">
                  You need at least
                  75% to complete
                  this module.
                </p>
              </>
            )}

            <div className="mt-8 rounded-2xl border border-glass-border bg-background/30 p-6">
              <p className="text-sm text-muted-foreground">
                Your Score
              </p>

              <p className="text-5xl font-bold text-primary mt-2">
                {
                  quizResult.percent
                }
                %
              </p>

              <p className="text-sm text-muted-foreground mt-2">
                {
                  quizResult.score
                }{" "}
                /{" "}
                {
                  quizResult.total
                }{" "}
                correct
              </p>
            </div>

            {quizResult.passed ? (
              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
                {next ? (
                  <Button
                    className="neon-btn"
                    asChild
                  >
                    <Link
                      to={`/internship/modules/${enrollmentId}/${next.id}`}
                      replace
                    >
                      Next Module
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    className="neon-btn"
                    asChild
                  >
                    <Link
                      to={`/internship/modules/${enrollmentId}`}
                      replace
                    >
                      View All Modules
                    </Link>
                  </Button>
                )}

                <Button
                  variant="outline"
                  asChild
                >
                  <Link
                    to="/internship/dashboard"
                  >
                    Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
                <Button
                  className="neon-btn"
                  onClick={
                    retryQuiz
                  }
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Quiz
                </Button>

                <Button
                  variant="outline"
                  asChild
                >
                  <Link
                    to={`/internship/modules/${enrollmentId}`}
                    replace
                  >
                    All Modules
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ==========================================================
     QUIZ VIEW
  ========================================================== */

  if (
    quizStarted &&
    !quizFinished
  ) {
    return (
      <div className="pt-32 pb-24 max-w-3xl mx-auto px-6">
        <Link
          to={`/internship/modules/${enrollmentId}/${current.id}`}
          replace
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => {
            setQuizStarted(
              false
            );
          }}
        >
          <ArrowLeft className="inline h-4 w-4 mr-1" />
          Back to Module
        </Link>

        <Card className="border-primary/20 bg-background/80 backdrop-blur-xl mt-4">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary text-sm font-medium">
              <ClipboardCheck className="h-4 w-4" />

              Module Quiz
            </div>

            <CardTitle className="text-2xl">
              {current.title}
            </CardTitle>

            {quizQuestions.length >
              0 && (
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm text-muted-foreground">
                  Question{" "}
                  {questionIndex +
                    1}{" "}
                  of{" "}
                  {
                    quizQuestions.length
                  }
                </span>

                <span className="text-sm text-primary font-medium">
                  Pass Mark: 75%
                </span>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {quizLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                Loading quiz…
              </div>
            ) : !currentQuestion ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  No quiz question
                  is available.
                </p>
              </div>
            ) : (
              <div
                data-module-quiz
                className="select-none"
              >
                {/* PROGRESS */}

                <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-8">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${
                        ((questionIndex +
                          1) /
                          quizQuestions.length) *
                        100
                      }%`,
                    }}
                  />
                </div>

                {/* QUESTION */}

                <div className="mb-8">
                  <p className="text-xl font-semibold leading-relaxed">
                    {
                      currentQuestion.question
                    }
                  </p>
                </div>

                {/* OPTIONS */}

                <div className="space-y-3">
                  {currentQuestion.options.map(
                    (
                      option,
                      optionIndex
                    ) => {
                      const selected =
                        selectedAnswer ===
                        optionIndex;

                      return (
                        <button
                          key={
                            optionIndex
                          }
                          type="button"
                          disabled={
                            submittingAnswer
                          }
                          onClick={() =>
                            setSelectedAnswer(
                              optionIndex
                            )
                          }
                          className={[
                            "w-full text-left rounded-xl border p-4 transition-all duration-200",
                            "select-none",
                            selected
                              ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,220,255,0.12)]"
                              : "border-glass-border bg-background/30 hover:bg-background/50 hover:border-primary/40",
                          ].join(
                            " "
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={[
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40 text-muted-foreground",
                              ].join(
                                " "
                              )}
                            >
                              {String.fromCharCode(
                                65 +
                                  optionIndex
                              )}
                            </div>

                            <span className="pt-0.5">
                              {
                                option
                              }
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>

                {/* SUBMIT */}

                <div className="flex justify-end mt-8">
                  <Button
                    className="neon-btn min-w-[180px]"
                    disabled={
                      selectedAnswer ===
                        null ||
                      submittingAnswer
                    }
                    onClick={
                      submitCurrentAnswer
                    }
                  >
                    {submittingAnswer
                      ? "Submitting…"
                      : questionIndex ===
                        quizQuestions.length -
                          1
                      ? "Finish Quiz"
                      : "Submit Answer"}
                  </Button>
                </div>

                {/* SECURITY NOTICE */}

                <div className="mt-8 rounded-lg border border-glass-border bg-muted/10 p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />

                    <div>
                      <p className="text-sm font-medium">
                        Secure Assessment
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        Your answers are
                        evaluated securely
                        by the TechDudes
                        assessment system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ==========================================================
     INDIVIDUAL MODULE PAGE
  ========================================================== */

  return (
    <div className="pt-32 pb-24 max-w-3xl mx-auto px-6">
      <Link
        to={`/internship/modules/${enrollmentId}`}
        replace
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← All modules
      </Link>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="border-glass-border bg-glass/40 backdrop-blur mt-4">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <BookOpen className="h-4 w-4" />

            Module{" "}
            {idx + 1}
          </div>

          <CardTitle className="text-2xl">
            Module {idx + 1} —{" "}
            {current.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* DESCRIPTION */}

          <p className="text-muted-foreground">
            {current.description}
          </p>

          {/* CONTENT */}

          <div className="prose prose-invert max-w-none text-foreground/90 whitespace-pre-wrap select-none">
            {current.content}
          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ==================================================
              COMPLETED MODULE
          ================================================== */}

          {done ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />

                <div>
                  <p className="font-semibold">
                    Module Completed
                  </p>

                  <p className="text-sm text-muted-foreground mt-1">
                    You passed this
                    module's quiz.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* =================================================
                  STEP 1: MARK CONTENT AS COMPLETED
              ================================================= */}

              {!contentFinished && (
                <div className="rounded-xl border border-glass-border bg-background/20 p-5">
                  <div className="flex items-start gap-3">
                    <Circle className="h-6 w-6 text-muted-foreground shrink-0" />

                    <div className="flex-1">
                      <p className="font-semibold">
                        Complete the
                        learning content
                      </p>

                      <p className="text-sm text-muted-foreground mt-1">
                        Read the module
                        content carefully.
                        After finishing,
                        mark the content as
                        completed to unlock
                        the module quiz.
                      </p>

                      <Button
                        className="neon-btn mt-5"
                        disabled={
                          marking
                        }
                        onClick={
                          markContentFinished
                        }
                      >
                        {marking
                          ? "Saving…"
                          : "Mark as Completed"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  STEP 2: QUIZ UNLOCKED
              ================================================= */}

              {contentFinished &&
                !quizStarted && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />

                      <div className="flex-1">
                        <p className="font-semibold">
                          Content Completed
                        </p>

                        <p className="text-sm text-muted-foreground mt-1">
                          Your module quiz
                          is now unlocked.
                          You must score at
                          least 75% to
                          complete this
                          module.
                        </p>

                        <Button
                          className="neon-btn mt-5"
                          disabled={
                            quizLoading
                          }
                          onClick={
                            startQuiz
                          }
                        >
                          <ClipboardCheck className="h-4 w-4 mr-2" />

                          {quizLoading
                            ? "Loading Quiz…"
                            : "Take Quiz"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
            </>
          )}

          {/* ==================================================
              NAVIGATION
          ================================================== */}

          {!quizStarted && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-glass-border">
              <div className="flex items-center gap-2">
                {prev ? (
                  <Button
                    variant="outline"
                    asChild
                  >
                    <Link
                      to={`/internship/modules/${enrollmentId}/${prev.id}`}
                      replace
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/internship/modules/${enrollmentId}`, {
                        replace: true,
                      })
                    }
                  >
                    ← All Modules
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {next && done ? (
                  <Button
                    variant="outline"
                    asChild
                  >
                    <Link
                      to={`/internship/modules/${enrollmentId}/${next.id}`}
                      replace
                    >
                      Next Module
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  onClick={() =>
                    navigate("/internship/dashboard", {
                      replace: true,
                    })
                  }
                >
                  Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Modules;