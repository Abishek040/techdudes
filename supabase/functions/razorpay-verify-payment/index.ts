// supabase/functions/razorpay-verify-payment/index.ts
// Verifies the Razorpay payment signature.
// This is the ONLY place payment_verified is ever set to true.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") || "https://techdudes.in";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      },
    );

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      enrollment_id,
    } = await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !enrollment_id
    ) {
      return json(
        {
          error: "missing fields",
        },
        400,
      );
    }

    // ---------------------------------------------------------
    // 1. Confirm the caller owns this enrollment
    // ---------------------------------------------------------

    const { data: enrollment, error: enrErr } =
      await supabase
        .from("enrollments")
        .select("id")
        .eq("id", enrollment_id)
        .single();

    if (enrErr || !enrollment) {
      return json(
        {
          error: "not authorized",
        },
        403,
      );
    }

    // ---------------------------------------------------------
    // 2. Verify Razorpay HMAC signature
    // ---------------------------------------------------------

    const payload =
      `${razorpay_order_id}|${razorpay_payment_id}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(RAZORPAY_KEY_SECRET),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

    const sigBuf = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payload),
    );

    const expected = [
      ...new Uint8Array(sigBuf),
    ]
      .map((b) =>
        b.toString(16).padStart(2, "0")
      )
      .join("");

    if (expected !== razorpay_signature) {
      const admin = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
      );

      await admin
        .from("payments")
        .update({
          status: "failed",
        })
        .eq(
          "razorpay_order_id",
          razorpay_order_id,
        );

      return json(
        {
          error:
            "signature mismatch — payment not verified",
        },
        400,
      );
    }

    const admin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    );

    // ---------------------------------------------------------
    // 3. Check whether this payment was already verified
    // ---------------------------------------------------------

    const { data: existing } = await admin
      .from("payments")
      .select(`
        status,
        payment_email_sent
      `)
      .eq(
        "razorpay_order_id",
        razorpay_order_id,
      )
      .single();

    if (existing?.status === "verified") {

      // Payment is already verified.
      // If email was somehow not sent, continue below.
      if (existing.payment_email_sent === true) {
        return json({
          verified: true,
          already: true,
          email_sent: true,
        });
      }
    }

    // ---------------------------------------------------------
    // 4. Mark payment as verified
    // ---------------------------------------------------------

    const { error: updErr } = await admin
      .from("payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "verified",
        verified_at: new Date().toISOString(),
      })
      .eq(
        "razorpay_order_id",
        razorpay_order_id,
      );

    if (updErr) {
      return json(
        {
          error: updErr.message,
        },
        500,
      );
    }

    // ---------------------------------------------------------
    // 5. Mark enrollment payment as verified
    // ---------------------------------------------------------

    const { error: enrUpdErr } = await admin
      .from("enrollments")
      .update({
        payment_verified: true,
        status: "completed",
      })
      .eq("id", enrollment_id);

    if (enrUpdErr) {
      return json(
        {
          error: enrUpdErr.message,
        },
        500,
      );
    }

    // ---------------------------------------------------------
    // 6. Get complete information for payment email
    // ---------------------------------------------------------

    const { data: payment } = await admin
  .from("payments")
  .select(`
    id,
    amount_paise,
    currency,
    razorpay_order_id,
    razorpay_payment_id,
    verified_at,
    payment_email_sent
  `)
      .eq(
        "razorpay_order_id",
        razorpay_order_id,
      )
      .single();

    const { data: fullEnrollment, error: fullEnrError } =
      await admin
        .from("enrollments")
        .select(`
          id,
          student_id,
          start_date,
          end_date,
          duration_days,
          profiles (
            full_name
          ),
          internships (
            title
          )
        `)
        .eq("id", enrollment_id)
        .single();

    if (fullEnrError || !fullEnrollment) {
      console.error(
        "Could not load enrollment for email:",
        fullEnrError,
      );

      // Payment is already verified, so don't report
      // the payment itself as failed.
      return json({
        verified: true,
        email_sent: false,
        warning:
          "Payment verified, but payment email could not be prepared.",
      });
    }

    // ---------------------------------------------------------
    // 7. Get student's email
    // ---------------------------------------------------------

    const {
      data: { user: student },
      error: studentError,
    } = await admin.auth.admin.getUserById(
      fullEnrollment.student_id,
    );

    if (
      studentError ||
      !student?.email
    ) {
      console.error(
        "Student email lookup error:",
        studentError,
      );

      return json({
        verified: true,
        email_sent: false,
        warning:
          "Payment verified, but student email address was not found.",
      });
    }

    // ---------------------------------------------------------
    // 8. Prevent duplicate payment email
    // ---------------------------------------------------------

    if (payment?.payment_email_sent === true) {
      return json({
        verified: true,
        email_sent: true,
        already: true,
      });
    }

    // ---------------------------------------------------------
    // 9. Prepare email information
    // ---------------------------------------------------------

    const profile = Array.isArray(
      fullEnrollment.profiles,
    )
      ? fullEnrollment.profiles[0]
      : fullEnrollment.profiles;

    const internship = Array.isArray(
      fullEnrollment.internships,
    )
      ? fullEnrollment.internships[0]
      : fullEnrollment.internships;

    const studentName =
      profile?.full_name?.trim() ||
      "Student";

    const internshipTitle =
      internship?.title?.trim() ||
      "TechDudes Online Internship";

    const formatDate = (dateString: string) => {
      const date = new Date(
        `${dateString}T00:00:00`,
      );

      return new Intl.DateTimeFormat(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        },
      ).format(date);
    };

    const startDate = formatDate(
      fullEnrollment.start_date,
    );

    const endDate = formatDate(
      fullEnrollment.end_date,
    );

    const paymentDate = payment?.verified_at
      ? new Intl.DateTimeFormat(
          "en-IN",
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          },
        ).format(
          new Date(payment.verified_at),
        )
      : "Verified successfully";

    const amount = payment?.amount_paise
  ? `₹${(payment.amount_paise / 100).toFixed(2)}`
  : "₹199.00";

    const currency =
      payment?.currency || "INR";

    const dashboardUrl =
      `${SITE_URL}/internship/dashboard`;

    // ---------------------------------------------------------
    // 10. Prepare plain-text email
    // ---------------------------------------------------------

    const subject =
      "Payment Confirmed – TechDudes Internship";

    const text = `
Dear ${studentName},

Thank you for completing your payment for your TechDudes internship!

Your payment has been successfully verified and your internship enrollment is now confirmed.

PAYMENT DETAILS
---------------
Internship: ${internshipTitle}
Amount Paid: ${amount}
Currency: ${currency}
Razorpay Order ID: ${razorpay_order_id}
Razorpay Payment ID: ${razorpay_payment_id}
Payment Verified: ${paymentDate}

INTERNSHIP DETAILS
------------------
Start Date: ${startDate}
End Date: ${endDate}
Duration: ${fullEnrollment.duration_days} days

Your certificate is scheduled to be generated on your selected internship end date, ${endDate}, provided all required internship modules and the final assessment have been completed successfully.

You can access your internship dashboard here:

${dashboardUrl}

Thank you for choosing TechDudes. We wish you a successful and valuable internship experience!

Best regards,
TechDudes
Internship & Training Team

https://techdudes.in
`.trim();

    // ---------------------------------------------------------
    // 11. Prepare HTML email
    // ---------------------------------------------------------

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Payment Confirmed</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f4f7fb;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    width:100%;
    padding:40px 0;
  ">

    <div style="
      max-width:650px;
      margin:0 auto;
      background:#ffffff;
      border-radius:14px;
      overflow:hidden;
      box-shadow:0 4px 20px rgba(0,0,0,0.08);
    ">

      <!-- Header -->

      <div style="
        background:#111827;
        padding:30px;
        text-align:center;
      ">

        <div style="
          font-size:28px;
          font-weight:700;
          color:#ffffff;
          letter-spacing:1px;
        ">
          TechDudes
        </div>

        <div style="
          margin-top:8px;
          font-size:14px;
          color:#cbd5e1;
        ">
          Internship & Training
        </div>

      </div>

      <!-- Content -->

      <div style="
        padding:40px 35px;
        color:#1f2937;
      ">

        <h1 style="
          margin:0 0 20px;
          font-size:26px;
          color:#111827;
        ">
          Payment Confirmed!
        </h1>

        <p style="
          font-size:16px;
          line-height:1.7;
          margin:0 0 18px;
        ">
          Dear <strong>${studentName}</strong>,
        </p>

        <p style="
          font-size:16px;
          line-height:1.7;
          margin:0 0 20px;
        ">
          Thank you for completing your payment for
          your TechDudes internship.
          Your payment has been
          <strong>successfully verified</strong>.
        </p>

        <!-- Payment Details -->

        <div style="
          margin:25px 0;
          padding:22px;
          background:#f8fafc;
          border:1px solid #e2e8f0;
          border-radius:10px;
        ">

          <div style="
            font-size:18px;
            font-weight:700;
            color:#111827;
            margin-bottom:18px;
          ">
            Payment Details
          </div>

          <table style="
            width:100%;
            border-collapse:collapse;
            font-size:14px;
          ">

            <tr>
              <td style="
                padding:8px 0;
                color:#64748b;
              ">
                Internship
              </td>

              <td style="
                padding:8px 0;
                font-weight:600;
                color:#111827;
              ">
                ${internshipTitle}
              </td>
            </tr>

            <tr>
              <td style="
                padding:8px 0;
                color:#64748b;
              ">
                Amount Paid
              </td>

              <td style="
                padding:8px 0;
                font-weight:700;
                color:#111827;
              ">
                ${amount}
              </td>
            </tr>

            <tr>
              <td style="
                padding:8px 0;
                color:#64748b;
              ">
                Currency
              </td>

              <td style="
                padding:8px 0;
                font-weight:600;
                color:#111827;
              ">
                ${currency}
              </td>
            </tr>

            <tr>
              <td style="
                padding:8px 0;
                color:#64748b;
              ">
                Order ID
              </td>

              <td style="
                padding:8px 0;
                font-size:12px;
                word-break:break-all;
                color:#111827;
              ">
                ${razorpay_order_id}
              </td>
            </tr>

            <tr>
              <td style="
                padding:8px 0;
                color:#64748b;
              ">
                Payment ID
              </td>

              <td style="
                padding:8px 0;
                font-size:12px;
                word-break:break-all;
                color:#111827;
              ">
                ${razorpay_payment_id}
              </td>
            </tr>

            <tr>
              <td style="
                padding:8px 0;
                color:#64748b;
              ">
                Verified On
              </td>

              <td style="
                padding:8px 0;
                font-weight:600;
                color:#111827;
              ">
                ${paymentDate}
              </td>
            </tr>

          </table>

        </div>

        <!-- Internship Details -->

        <div style="
          margin:25px 0;
          padding:22px;
          background:#f8fafc;
          border:1px solid #e2e8f0;
          border-radius:10px;
        ">

          <div style="
            font-size:18px;
            font-weight:700;
            color:#111827;
            margin-bottom:15px;
          ">
            Internship Schedule
          </div>

          <p style="
            margin:8px 0;
            font-size:15px;
            color:#475569;
          ">
            <strong>Start Date:</strong> ${startDate}
          </p>

          <p style="
            margin:8px 0;
            font-size:15px;
            color:#475569;
          ">
            <strong>End Date:</strong> ${endDate}
          </p>

          <p style="
            margin:8px 0;
            font-size:15px;
            color:#475569;
          ">
            <strong>Duration:</strong>
            ${fullEnrollment.duration_days} days
          </p>

        </div>

        <!-- Certificate Information -->

        <div style="
          margin:25px 0;
          padding:20px;
          background:#eff6ff;
          border-left:4px solid #2563eb;
          border-radius:6px;
        ">

          <div style="
            font-size:16px;
            font-weight:700;
            color:#1e3a8a;
            margin-bottom:8px;
          ">
            Certificate Schedule
          </div>

          <div style="
            font-size:15px;
            line-height:1.7;
            color:#334155;
          ">
            Your certificate is scheduled to be
            generated on your selected internship
            end date,
            <strong>${endDate}</strong>,
            provided all required modules and the
            final assessment have been completed
            successfully.
          </div>

        </div>

        <div style="
          text-align:center;
          margin:30px 0;
        ">

          <a
            href="${dashboardUrl}"
            style="
              display:inline-block;
              padding:14px 28px;
              background:#111827;
              color:#ffffff;
              text-decoration:none;
              border-radius:8px;
              font-size:15px;
              font-weight:600;
            "
          >
            Open Internship Dashboard
          </a>

        </div>

        <p style="
          font-size:15px;
          line-height:1.7;
          color:#475569;
          margin:25px 0 0;
        ">
          Thank you for choosing
          <strong>TechDudes</strong>.
          We wish you a successful and valuable
          internship experience!
        </p>

        <p style="
          font-size:15px;
          line-height:1.7;
          color:#475569;
          margin:20px 0 0;
        ">
          Best regards,<br />
          <strong>TechDudes</strong><br />
          Internship & Training Team
        </p>

      </div>

      <!-- Footer -->

      <div style="
        padding:22px 30px;
        background:#f8fafc;
        border-top:1px solid #e5e7eb;
        text-align:center;
      ">

        <div style="
          font-size:13px;
          color:#64748b;
        ">
          © TechDudes — Internship & Training
        </div>

        <div style="
          margin-top:7px;
          font-size:12px;
          color:#94a3b8;
        ">
          This is an automated email. Please do not reply.
        </div>

      </div>

    </div>

  </div>

</body>
</html>
`;

    // ---------------------------------------------------------
    // 12. Send payment confirmation email
    // ---------------------------------------------------------

    if (!RESEND_API_KEY) {
      console.error(
        "RESEND_API_KEY is missing",
      );

      return json({
        verified: true,
        email_sent: false,
        warning:
          "Payment verified, but email service is not configured.",
      });
    }

    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${RESEND_API_KEY}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          from:
            "TechDudes Internship <noreply@techdudes.in>",
          to: [student.email],
          subject,
          html,
          text,
        }),
      },
    );

    const resendData =
      await resendResponse.json();

    if (!resendResponse.ok) {
      console.error(
        "Resend payment email error:",
        resendData,
      );

      return json({
        verified: true,
        email_sent: false,
        warning:
          "Payment verified, but payment confirmation email failed.",
      });
    }

    // ---------------------------------------------------------
    // 13. Mark payment email as sent
    // ---------------------------------------------------------

    const { error: emailUpdateError } =
      await admin
        .from("payments")
        .update({
          payment_email_sent: true,
          payment_email_sent_at:
            new Date().toISOString(),
        })
        .eq(
          "razorpay_order_id",
          razorpay_order_id,
        );

    if (emailUpdateError) {
      console.error(
        "Failed to mark payment email as sent:",
        emailUpdateError,
      );

      return json({
        verified: true,
        email_sent: true,
        warning:
          "Payment email was sent, but the sent status could not be updated.",
        resend_id:
          resendData?.id ?? null,
      });
    }

    // ---------------------------------------------------------
    // 14. Success
    // ---------------------------------------------------------

    return json({
      verified: true,
      email_sent: true,
      resend_id:
        resendData?.id ?? null,
    });
  } catch (e) {
    console.error(
      "Payment verification error:",
      e,
    );

    return json(
      {
        error: String(e),
      },
      500,
    );
  }
});

function json(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}