import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY =
  Deno.env.get("RESEND_API_KEY")!;
const SITE_URL =
  Deno.env.get("SITE_URL") || "https://techdudes.in";

const admin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return json(
        { error: "Method not allowed" },
        405,
      );
    }

    const body = await req.json();

    const paymentId = body?.payment_id;

    if (
      !paymentId ||
      typeof paymentId !== "string"
    ) {
      return json(
        {
          error: "payment_id is required",
        },
        400,
      );
    }

    // ---------------------------------------------------------
    // 1. Find the payment
    // ---------------------------------------------------------

    const { data: payment, error: paymentError } =
      await admin
        .from("payments")
        .select(`
          id,
          enrollment_id,
          amount_paise,
          status,
          razorpay_order_id,
          razorpay_payment_id,
          verified_at,
          payment_email_sent
        `)
        .eq("id", paymentId)
        .single();

    if (paymentError || !payment) {
      return json(
        {
          error: "Payment not found",
        },
        404,
      );
    }

    // ---------------------------------------------------------
    // 2. Payment MUST already be verified
    // ---------------------------------------------------------

    if (payment.status !== "verified") {
      return json(
        {
          error:
            "Payment is not verified. Email cannot be sent.",
        },
        400,
      );
    }

    // ---------------------------------------------------------
    // 3. Prevent duplicate email
    // ---------------------------------------------------------

    if (payment.payment_email_sent === true) {
      return json({
        status: "already_sent",
        email_sent: true,
      });
    }

    // ---------------------------------------------------------
    // 4. Get enrollment
    // ---------------------------------------------------------

    const { data: enrollment, error: enrollmentError } =
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
        .eq(
          "id",
          payment.enrollment_id,
        )
        .single();

    if (
      enrollmentError ||
      !enrollment
    ) {
      console.error(
        "Enrollment lookup error:",
        enrollmentError,
      );

      return json(
        {
          error:
            "Enrollment not found for this payment",
        },
        404,
      );
    }

    // ---------------------------------------------------------
    // 5. Get student email
    // ---------------------------------------------------------

    const {
      data: { user: student },
      error: studentError,
    } = await admin.auth.admin.getUserById(
      enrollment.student_id,
    );

    if (
      studentError ||
      !student?.email
    ) {
      return json(
        {
          error:
            "Student email address not found",
        },
        400,
      );
    }

    // ---------------------------------------------------------
    // 6. Prepare details
    // ---------------------------------------------------------

    const profile = Array.isArray(
      enrollment.profiles,
    )
      ? enrollment.profiles[0]
      : enrollment.profiles;

    const internship = Array.isArray(
      enrollment.internships,
    )
      ? enrollment.internships[0]
      : enrollment.internships;

    const studentName =
      profile?.full_name?.trim() ||
      "Student";

    const internshipTitle =
      internship?.title?.trim() ||
      "TechDudes Online Internship";

    const startDate =
      formatDate(enrollment.start_date);

    const endDate =
      formatDate(enrollment.end_date);

    const paymentDate =
      payment.verified_at
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

    const amount =
      `₹${(payment.amount_paise / 100).toFixed(2)}`;

    const dashboardUrl =
      `${SITE_URL}/internship/dashboard`;

    const safeName =
      escapeHtml(studentName);

    const safeTitle =
      escapeHtml(internshipTitle);

    // ---------------------------------------------------------
    // 7. Email content
    // ---------------------------------------------------------

    const subject =
      "Payment Confirmed – TechDudes Internship";

    const text = `
Dear ${studentName},

Thank you for completing your payment for your TechDudes internship!

Your payment has been successfully verified.

PAYMENT DETAILS
----------------
Internship: ${internshipTitle}
Amount Paid: ${amount}
Currency: INR
Razorpay Order ID: ${payment.razorpay_order_id}
Razorpay Payment ID: ${payment.razorpay_payment_id}
Payment Verified: ${paymentDate}

INTERNSHIP DETAILS
------------------
Start Date: ${startDate}
End Date: ${endDate}
Duration: ${enrollment.duration_days} days

Your certificate is scheduled to be generated on your selected internship end date, ${endDate}, provided all required internship modules and the final assessment have been completed successfully.

You can access your internship dashboard here:

${dashboardUrl}

Thank you for choosing TechDudes. We wish you a successful and valuable internship experience!

Best regards,
TechDudes
Internship & Training Team

https://techdudes.in
`.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
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
      ">
        Dear <strong>${safeName}</strong>,
      </p>

      <p style="
        font-size:16px;
        line-height:1.7;
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
          margin-bottom:18px;
          color:#111827;
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
            ">
              ${safeTitle}
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
            ">
              INR
            </td>
          </tr>

          <tr>
            <td style="
              padding:8px 0;
              color:#64748b;
            ">
              Razorpay Order ID
            </td>

            <td style="
              padding:8px 0;
              font-size:12px;
              word-break:break-all;
            ">
              ${payment.razorpay_order_id}
            </td>
          </tr>

          <tr>
            <td style="
              padding:8px 0;
              color:#64748b;
            ">
              Razorpay Payment ID
            </td>

            <td style="
              padding:8px 0;
              font-size:12px;
              word-break:break-all;
            ">
              ${payment.razorpay_payment_id}
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
            ">
              ${paymentDate}
            </td>
          </tr>

        </table>

      </div>

      <!-- Internship Schedule -->

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
          margin-bottom:15px;
        ">
          Internship Schedule
        </div>

        <p style="
          font-size:15px;
          color:#475569;
        ">
          <strong>Start Date:</strong>
          ${startDate}
        </p>

        <p style="
          font-size:15px;
          color:#475569;
        ">
          <strong>End Date:</strong>
          ${endDate}
        </p>

        <p style="
          font-size:15px;
          color:#475569;
        ">
          <strong>Duration:</strong>
          ${enrollment.duration_days} days
        </p>

      </div>

      <!-- Certificate -->

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

      <!-- Dashboard -->

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
      ">
        Best regards,<br>
        <strong>TechDudes</strong><br>
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
    // 8. Send email through Resend
    // ---------------------------------------------------------

    if (!RESEND_API_KEY) {
      return json(
        {
          error:
            "RESEND_API_KEY is not configured",
        },
        500,
      );
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
        "Resend error:",
        resendData,
      );

      return json(
        {
          error:
            "Failed to send payment confirmation email",
          details: resendData,
        },
        500,
      );
    }

    // ---------------------------------------------------------
    // 9. Mark email as sent
    // ---------------------------------------------------------

    const { error: updateError } =
      await admin
        .from("payments")
        .update({
          payment_email_sent: true,
          payment_email_sent_at:
            new Date().toISOString(),
        })
        .eq("id", payment.id);

    if (updateError) {
      console.error(
        "Failed to mark email as sent:",
        updateError,
      );

      return json({
        status: "sent",
        email_sent: true,
        warning:
          "Email was sent, but the sent status could not be updated.",
        resend_id:
          resendData?.id ?? null,
      });
    }

    return json({
      status: "sent",
      email_sent: true,
      resend_id:
        resendData?.id ?? null,
    });
  } catch (error) {
    console.error(
      "Payment confirmation email error:",
      error,
    );

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error",
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