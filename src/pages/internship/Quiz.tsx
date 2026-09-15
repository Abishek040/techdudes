import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { supabase } from "@/lib/supabaseClient";
import type { Enrollment } from "@/types/internship";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import useInternshipBackToDashboard from "@/hooks/useInternshipBackToDashboard";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
};

type QuizResult = {
  passed: boolean;
  score: number;
  percent: number;
};

const getIndiaToday = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
};

const formatDate = (date: string) => {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const Quiz = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();

  useInternshipBackToDashboard();

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  /*
   * The UI stores the selected answer as the actual option text.
   *
   * Example:
   *
   * {
   *   "question-id": "Internet of Things"
   * }
   *
   * The correct answer is NEVER stored in this component.
   * The server-side submit_quiz() RPC performs the actual grading.
   */
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<QuizResult | null>(null);

  const today = getIndiaToday();

  // ==========================================================
  // QUIZ ANTI-COPY PROTECTION
  // ==========================================================

  useEffect(() => {
    /*
     * Prevent common browser actions that allow normal copying
     * of quiz questions and options.
     *
     * NOTE:
     * This is browser-level protection only.
     * It cannot prevent screenshots, OCR, another device,
     * or advanced browser inspection.
     */

    const preventCopy = (event: ClipboardEvent) => {
      event.preventDefault();
    };

    const preventCut = (event: ClipboardEvent) => {
      event.preventDefault();
    };

    const preventPaste = (event: ClipboardEvent) => {
      event.preventDefault();
    };

    const preventContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const preventDrag = (event: DragEvent) => {
      event.preventDefault();
    };

    const preventSelectStart = (event: Event) => {
      event.preventDefault();
    };

    const preventKeyboardShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      const ctrlOrCommand = event.ctrlKey || event.metaKey;

      /*
       * Block:
       *
       * Ctrl/Cmd + C = Copy
       * Ctrl/Cmd + X = Cut
       * Ctrl/Cmd + V = Paste
       * Ctrl/Cmd + A = Select All
       * Ctrl/Cmd + U = View Source
       * Ctrl/Cmd + S = Save
       * Ctrl/Cmd + P = Print
       */
      if (
        ctrlOrCommand &&
        ["c", "x", "v", "a", "u", "s", "p"].includes(key)
      ) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      /*
       * Common browser DevTools shortcuts.
       *
       * F12
       * Ctrl/Cmd + Shift + I
       * Ctrl/Cmd + Shift + J
       * Ctrl/Cmd + Shift + C
       */
      if (event.key === "F12") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (
        ctrlOrCommand &&
        event.shiftKey &&
        ["i", "j", "c"].includes(key)
      ) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    };

    document.addEventListener("copy", preventCopy, true);
    document.addEventListener("cut", preventCut, true);
    document.addEventListener("paste", preventPaste, true);
    document.addEventListener(
      "contextmenu",
      preventContextMenu,
      true
    );
    document.addEventListener("dragstart", preventDrag, true);
    document.addEventListener(
      "selectstart",
      preventSelectStart,
      true
    );
    document.addEventListener(
      "keydown",
      preventKeyboardShortcuts,
      true
    );

    return () => {
      document.removeEventListener("copy", preventCopy, true);
      document.removeEventListener("cut", preventCut, true);
      document.removeEventListener("paste", preventPaste, true);
      document.removeEventListener(
        "contextmenu",
        preventContextMenu,
        true
      );
      document.removeEventListener("dragstart", preventDrag, true);
      document.removeEventListener(
        "selectstart",
        preventSelectStart,
        true
      );
      document.removeEventListener(
        "keydown",
        preventKeyboardShortcuts,
        true
      );
    };
  }, []);

  // ==========================================================
  // LOAD QUIZ
  // ==========================================================

  const load = async () => {
    if (!enrollmentId) {
      setError("Invalid enrollment.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // --------------------------------------------------------
    // 1. Load enrollment
    // --------------------------------------------------------

    const { data: enr, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("*")
      .eq("id", enrollmentId)
      .single();

    if (enrollmentError || !enr) {
      setError(
        enrollmentError?.message ||
          "Unable to load your internship."
      );

      setLoading(false);
      return;
    }

    const loadedEnrollment = enr as Enrollment;

    setEnrollment(loadedEnrollment);

    // --------------------------------------------------------
    // 2. Check start date
    // --------------------------------------------------------

    const internshipNotStarted =
      today < loadedEnrollment.start_date;

    if (internshipNotStarted) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    // --------------------------------------------------------
    // 3. Check module completion
    // --------------------------------------------------------

    if (!loadedEnrollment.modules_completed) {
      setLoading(false);
      return;
    }

    // --------------------------------------------------------
    // 4. Load final assessment questions
    // --------------------------------------------------------

    const {
      data: quizData,
      error: quizError,
    } = await supabase.rpc("get_quiz_questions", {
      p_enrollment_id: enrollmentId,
    });

    if (quizError) {
      setError(quizError.message);
      setLoading(false);
      return;
    }

    setQuestions((quizData as QuizQuestion[]) ?? []);

    setLoading(false);
  };

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="pt-32 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  // ==========================================================
  // ERROR WITHOUT ENROLLMENT
  // ==========================================================

  if (error && !enrollment) {
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
                  navigate("/internship/dashboard")
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

  if (!enrollment) {
    return (
      <div className="pt-32 text-center text-muted-foreground">
        Unable to load internship.
      </div>
    );
  }

  // ==========================================================
  // START DATE LOCK
  // ==========================================================

  const internshipNotStarted =
    today < enrollment.start_date;

  if (internshipNotStarted) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20 bg-background/80 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v2h8z"
                  />
                </svg>
              </div>

              <CardTitle className="text-2xl">
                Quiz Not Available Yet
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center space-y-5">
              <p className="text-muted-foreground">
                Your internship has not started yet.
              </p>

              <div className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-5">
                <p className="text-sm text-muted-foreground mb-2">
                  Course and quiz access begins on
                </p>

                <p className="text-xl font-semibold text-primary">
                  {formatDate(enrollment.start_date)}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                Complete all the learning modules before taking
                the final assessment.
              </p>

              <Button
                variant="outline"
                onClick={() =>
                  navigate("/internship/dashboard")
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

  // ==========================================================
  // MODULES NOT COMPLETED
  // ==========================================================

  if (!enrollment.modules_completed) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-glass-border bg-glass/40 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle>
                Complete All Modules First
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center space-y-5">
              <p className="text-muted-foreground">
                You need to complete all internship modules
                before you can take the final assessment.
              </p>

              <Button asChild className="neon-btn">
                <Link
                  to={`/internship/modules/${enrollmentId}`}
                >
                  Continue Modules
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ==========================================================
  // QUIZ ALREADY PASSED
  // ==========================================================

  if (enrollment.quiz_passed && !result) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20 bg-background/80 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <CardTitle className="text-2xl">
                Final Assessment Already Passed
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center space-y-5">
              <p className="text-muted-foreground">
                You have already successfully completed the
                final assessment for this internship.
              </p>

              <Button
                className="neon-btn"
                onClick={() =>
                  navigate("/internship/dashboard")
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

  // ==========================================================
  // SUBMIT QUIZ
  // ==========================================================

  const handleSubmit = async () => {
    if (!enrollmentId) return;

    setError(null);

    // --------------------------------------------------------
    // Make sure every question has an answer
    // --------------------------------------------------------

    const unanswered = questions.some(
      (question) => !answers[question.id]
    );

    if (unanswered) {
      setError(
        "Please answer all questions before submitting the assessment."
      );

      return;
    }

    setSubmitting(true);

    /*
     * IMPORTANT SECURITY DESIGN
     *
     * The browser only knows the question and options.
     *
     * It does NOT know:
     *
     * - correct_option
     * - answer key
     * - score calculation
     * - pass/fail calculation
     *
     * The selected answer is converted into its 1-based
     * option number and sent to the secure server-side RPC.
     */

    const answerPayload = questions.map((question) => {
      const selectedText = answers[question.id];

      const selectedIndex =
        question.options.indexOf(selectedText);

      return {
        question_id: question.id,

        // Database uses 1-based option numbers:
        // 1 = A
        // 2 = B
        // 3 = C
        // 4 = D
        selected: selectedIndex + 1,
      };
    });

    // --------------------------------------------------------
    // Safety check
    // --------------------------------------------------------

    const invalidAnswer = answerPayload.some(
      (answer) => answer.selected < 1
    );

    if (invalidAnswer) {
      setSubmitting(false);

      setError(
        "Unable to process one or more answers. Please try again."
      );

      return;
    }

    // --------------------------------------------------------
    // Submit to Supabase
    // --------------------------------------------------------

    const {
      data,
      error: submitError,
    } = await supabase.rpc("submit_quiz", {
      p_enrollment_id: enrollmentId,

      /*
       * Send an ARRAY, not the answers object.
       *
       * Example:
       *
       * [
       *   {
       *     question_id: "...",
       *     selected: 2
       *   }
       * ]
       */
      p_answers: answerPayload,
    });

    setSubmitting(false);

    if (submitError) {
      setError(submitError.message);
      return;
    }

    // --------------------------------------------------------
    // Supabase TABLE result
    //
    // RPC returns:
    //
    // score
    // total
    // percent
    // passed
    // --------------------------------------------------------

    const rpcResult = Array.isArray(data)
      ? data[0]
      : data;

    const quizResult: QuizResult = {
      passed: Boolean(rpcResult?.passed),

      score: Number(
        rpcResult?.score ?? 0
      ),

      percent: Number(
        rpcResult?.percent ?? 0
      ),
    };

    setResult(quizResult);
  };

  // ==========================================================
  // RESULT SCREEN
  // ==========================================================

  if (result) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20 bg-background/80 backdrop-blur-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">
                {result.passed
                  ? "Assessment Passed!"
                  : "Assessment Not Passed"}
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center space-y-6">
              <div className="text-5xl font-bold text-primary">
                {result.percent}%
              </div>

              <p className="text-muted-foreground">
                Score: {result.score} / {questions.length}
              </p>

              {result.passed ? (
                <>
                  <p className="text-muted-foreground">
                    Congratulations! You have successfully
                    completed the final assessment.
                  </p>

                  <Button
                    className="neon-btn"
                    onClick={() =>
                      navigate("/internship/dashboard")
                    }
                  >
                    Continue to Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    You did not reach the required passing
                    score. Please review the modules and try
                    again.
                  </p>

                  <Button
                    className="neon-btn"
                    onClick={() => {
                      setResult(null);
                      setAnswers({});
                      setError(null);
                    }}
                  >
                    Try Again
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ==========================================================
  // QUIZ UI
  // ==========================================================

  return (
    <div
      className="pt-32 pb-24 max-w-3xl mx-auto px-6"
      style={{
        /*
         * Additional CSS-level protection against normal
         * text selection.
         */
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      onCopy={(event) => {
        event.preventDefault();
      }}
      onCut={(event) => {
        event.preventDefault();
      }}
      onPaste={(event) => {
        event.preventDefault();
      }}
      onDragStart={(event) => {
        event.preventDefault();
      }}
    >
      <Link
        to={`/internship/modules/${enrollmentId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
        draggable={false}
      >
        ← Back to Modules
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Final Assessment
        </h1>

        <p className="text-muted-foreground mt-2">
          Answer all 15 questions and submit your final assessment.
        </p>

        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              Passing requirement:
            </span>{" "}
            75% — You need at least 12 correct answers out of 15.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card
            key={question.id}
            className="border-glass-border bg-glass/40 backdrop-blur"
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
            onContextMenu={(event) => {
              event.preventDefault();
            }}
            onCopy={(event) => {
              event.preventDefault();
            }}
            onCut={(event) => {
              event.preventDefault();
            }}
            onDragStart={(event) => {
              event.preventDefault();
            }}
          >
            <CardHeader>
              <CardTitle className="text-lg">
                {index + 1}. {question.question}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {question.options.map(
                  (option, optionIndex) => {
                    const selected =
                      answers[question.id] === option;

                    return (
                      <button
                        key={`${question.id}-${optionIndex}`}
                        type="button"
                        draggable={false}
                        onClick={() =>
                          setAnswers((previous) => ({
                            ...previous,
                            [question.id]: option,
                          }))
                        }
                        onContextMenu={(event) => {
                          event.preventDefault();
                        }}
                        onCopy={(event) => {
                          event.preventDefault();
                        }}
                        onCut={(event) => {
                          event.preventDefault();
                        }}
                        onDragStart={(event) => {
                          event.preventDefault();
                        }}
                        className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                          selected
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-glass-border bg-background/30 text-muted-foreground hover:bg-glass/50 hover:text-foreground"
                        }`}
                        style={{
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          MozUserSelect: "none",
                          msUserSelect: "none",
                        }}
                      >
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>

                        {option}
                      </button>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {questions.length > 0 && (
        <div className="mt-8 flex justify-end">
          <Button
            className="neon-btn"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting
              ? "Submitting…"
              : "Submit Assessment"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Quiz;