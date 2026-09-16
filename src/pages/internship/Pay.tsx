import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_CHECKOUT_SRC =
  "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;

    script.onload = () => resolve();

    script.onerror = () =>
      reject(
        new Error("Failed to load Razorpay checkout")
      );

    document.body.appendChild(script);
  });
}

const Pay = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();

  useInternshipBackToDashboard();

  const [enrollment, setEnrollment] =
    useState<Enrollment | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const loadEnrollment = async () => {
      if (!enrollmentId) {
        setError("Invalid enrollment.");
        setLoading(false);
        return;
      }

      const { data, error: enrollmentError } =
        await supabase
          .from("enrollments")
          .select("*, internships(*)")
          .eq("id", enrollmentId)
          .single();

      if (enrollmentError || !data) {
        setError(
          enrollmentError?.message ||
            "Unable to load enrollment."
        );
        setLoading(false);
        return;
      }

      setEnrollment(data as Enrollment);
      setLoading(false);
    };

    loadEnrollment();
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
  // INVALID / NOT FOUND
  // ==========================================================

  if (!enrollment) {
    return (
      <div className="pt-32 pb-24 text-center px-6">
        <p className="text-destructive">
          {error || "Enrollment not found."}
        </p>

        <Button
          className="mt-4 neon-btn"
          onClick={() =>
            navigate("/internship/dashboard")
          }
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // ==========================================================
  // PAYMENT ALREADY VERIFIED
  // ==========================================================

  if (enrollment.payment_verified) {
    return (
      <div className="pt-32 text-center px-6">
        <p className="text-foreground">
          Payment already verified for this enrollment.
        </p>

        <Button
          className="mt-4 neon-btn"
          onClick={() =>
            navigate("/internship/dashboard")
          }
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // ==========================================================
  // PAYMENT LOCK
  //
  // Student MUST:
  // 1. Complete all modules
  // 2. Pass final assessment
  //
  // before payment is allowed.
  // ==========================================================

  if (
    !enrollment.modules_completed ||
    !enrollment.quiz_passed
  ) {
    return (
      <div className="pt-32 pb-24 max-w-md mx-auto px-6">
        <Card className="border-glass-border bg-glass/40 backdrop-blur">
          <CardHeader>
            <CardTitle>
              Certificate Fee Locked
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-sm">
              The certificate fee can only be paid after
              you successfully complete the internship
              requirements.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-glass-border p-3">
                <span className="text-sm">
                  Complete all 15 modules
                </span>

                <span
                  className={
                    enrollment.modules_completed
                      ? "text-green-400 font-medium"
                      : "text-yellow-400 font-medium"
                  }
                >
                  {enrollment.modules_completed
                    ? "Completed"
                    : "Pending"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-glass-border p-3">
                <span className="text-sm">
                  Pass Final Assessment
                </span>

                <span
                  className={
                    enrollment.quiz_passed
                      ? "text-green-400 font-medium"
                      : "text-yellow-400 font-medium"
                  }
                >
                  {enrollment.quiz_passed
                    ? "Passed"
                    : "Pending"}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Complete the pending requirements first.
              Once both are completed, the certificate
              payment option will become available.
            </p>

            <Button
              className="w-full neon-btn"
              onClick={() =>
                navigate(
                  `/internship/modules/${enrollment.id}`
                )
              }
            >
              Go to Internship
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                navigate("/internship/dashboard")
              }
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==========================================================
  // PAYMENT
  // ==========================================================

  const handlePay = async () => {
    setError(null);
    setProcessing(true);

    try {
      // --------------------------------------------------------
      // GET CURRENT SESSION
      // --------------------------------------------------------

      const { data: session } =
        await supabase.auth.getSession();

      const token =
        session.session?.access_token;

      if (!token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      // --------------------------------------------------------
      // CREATE RAZORPAY ORDER
      // --------------------------------------------------------

      const orderRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            enrollment_id: enrollmentId,
          }),
        }
      );

      const order = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(
          order.error ??
            "Could not create payment order"
        );
      }

      // --------------------------------------------------------
      // LOAD RAZORPAY CHECKOUT
      // --------------------------------------------------------

      await loadRazorpayScript();

      // --------------------------------------------------------
      // OPEN RAZORPAY
      // --------------------------------------------------------

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,

        name: "TechDudes",

        description:
          enrollment.internships?.title,

        handler: async (response: any) => {
          try {
            // --------------------------------------------------
            // VERIFY PAYMENT
            // --------------------------------------------------

            const verifyRes = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,

                  enrollment_id:
                    enrollmentId,
                }),
              }
            );

            const verifyData =
              await verifyRes.json();

            if (
              verifyRes.ok &&
              verifyData.verified
            ) {
              navigate(
                "/internship/dashboard"
              );
            } else {
              setError(
                "Payment could not be verified. Please contact support with your payment ID."
              );
            }
          } catch (verifyError: any) {
            setError(
              verifyError?.message ||
                "Payment verification failed."
            );
          } finally {
            setProcessing(false);
          }
        },

        modal: {
          ondismiss: () =>
            setProcessing(false),
        },

        theme: {
          color: "#00e5e5",
        },
      });

      rzp.open();
    } catch (e: any) {
      setError(
        e.message ??
          "Something went wrong"
      );

      setProcessing(false);
    }
  };

  // ==========================================================
  // PAYMENT PAGE
  // ==========================================================

  const certificateFee =
    (
      (enrollment.internships
        ?.certificate_fee_paise ??
        0) / 100
    ).toFixed(0);

  return (
    <div className="pt-32 pb-24 max-w-md mx-auto px-6">
      <Card className="border-glass-border bg-glass/40 backdrop-blur">
        <CardHeader>
          <CardTitle>
            Certificate Fee
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* --------------------------------------------------
              INTERNSHIP + PRICE
          -------------------------------------------------- */}

          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {enrollment.internships?.title}
            </p>

            <p className="text-4xl font-bold text-foreground mt-2">
              ₹{certificateFee}
            </p>
          </div>

          {/* --------------------------------------------------
              COMPLETION MESSAGE
          -------------------------------------------------- */}

          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-sm">
            <p className="text-foreground font-medium">
              Internship requirements completed
            </p>

            <p className="text-muted-foreground mt-1">
              You have completed all modules and passed
              the final assessment. You can now pay the
              certificate fee.
            </p>
          </div>

          {/* --------------------------------------------------
              PAYMENT ERROR
          -------------------------------------------------- */}

          {error && (
            <p className="text-destructive text-sm text-center">
              {error}
            </p>
          )}

          {/* --------------------------------------------------
              LEGAL POLICY AGREEMENT
          -------------------------------------------------- */}

          <div className="rounded-lg border border-glass-border bg-glass/20 p-4">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              By proceeding with payment, you agree to our{" "}
              <Link
                to="/terms"
                className="text-primary hover:underline font-medium"
              >
                Terms & Conditions
              </Link>
              ,{" "}
              <Link
                to="/privacy-policy"
                className="text-primary hover:underline font-medium"
              >
                Privacy Policy
              </Link>
              {" "}and{" "}
              <Link
                to="/refund-policy"
                className="text-primary hover:underline font-medium"
              >
                Refund & Cancellation Policy
              </Link>
              .
            </p>
          </div>

          {/* --------------------------------------------------
              PAY BUTTON
          -------------------------------------------------- */}

          <Button
            className="w-full neon-btn"
            disabled={processing}
            onClick={handlePay}
          >
            {processing
              ? "Processing…"
              : `Pay ₹${certificateFee} with Razorpay`}
          </Button>

          {/* --------------------------------------------------
              SUPPORTING PAYMENT NOTE
          -------------------------------------------------- */}

          <p className="text-xs text-center text-muted-foreground">
            Payments are securely processed through Razorpay.
          </p>

        </CardContent>
      </Card>
    </div>
  );
};

export default Pay;