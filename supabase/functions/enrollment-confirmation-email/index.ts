import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SITE_URL =
  Deno.env.get("SITE_URL") || "https://techdudes.in";

const admin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

// ============================================================
// INDIA TODAY
// ============================================================

function getIndiaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// ============================================================
// GET INDIA DATE FROM TIMESTAMP
// ============================================================

function getIndiaDateFromTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ============================================================
// MAIN FUNCTION
// ============================================================

Deno.serve(async (req) => {
  // ----------------------------------------------------------
  // CORS
  // ----------------------------------------------------------

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // --------------------------------------------------------
    // 1. METHOD CHECK
    // --------------------------------------------------------

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // --------------------------------------------------------
    // 2. GET LOGGED-IN USER
    // --------------------------------------------------------

    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: "Missing authorization token",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const token = authHeader
      .replace("Bearer ", "")
      .trim();

    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Invalid or expired authentication token",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // --------------------------------------------------------
    // 3. READ ENROLLMENT ID
    // --------------------------------------------------------

    const body = await req.json();

    const enrollmentId = body?.enrollment_id;

    if (
      !enrollmentId ||
      typeof enrollmentId !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error: "enrollment_id is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // --------------------------------------------------------
    // 4. GET ENROLLMENT DETAILS
    // --------------------------------------------------------

    const {
      data: enrollment,
      error: enrollmentError,
    } = await admin
      .from("enrollments")
      .select(`
        id,
        student_id,
        internship_id,
        created_at,
        start_date,
        end_date,
        duration_days,
        status,
        enrollment_email_sent,
        start_email_sent,
        start_email_sent_at,
        profiles (
          full_name
        ),
        internships (
          title
        )
      `)
      .eq("id", enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      console.error(
        "Enrollment lookup error:",
        enrollmentError,
      );

      return new Response(
        JSON.stringify({
          error: "Enrollment not found",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // --------------------------------------------------------
    // 5. SECURITY CHECK
    // --------------------------------------------------------

    if (enrollment.student_id !== user.id) {
      return new Response(
        JSON.stringify({
          error:
            "You are not authorized for this enrollment",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // --------------------------------------------------------
    // 6. PREVENT DUPLICATE ENROLLMENT EMAIL
    // --------------------------------------------------------

    if (enrollment.enrollment_email_sent === true) {
      return new Response(
        JSON.stringify({
          status: "already_sent",
          message:
            "Enrollment confirmation email was already sent.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // --------------------------------------------------------
    // 7. GET STUDENT EMAIL
    // --------------------------------------------------------

    const {
      data: { user: student },
      error: studentError,
    } = await admin.auth.admin.getUserById(
      enrollment.student_id,
    );

    if (studentError || !student?.email) {
      console.error(
        "Student email lookup error:",
        studentError,
      );

      return new Response(
        JSON.stringify({
          error:
            "Student email address not found",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // --------------------------------------------------------
    // 8. PREPARE INFORMATION
    // --------------------------------------------------------

    const profile = Array.isArray(enrollment.profiles)
      ? enrollment.profiles[0]
      : enrollment.profiles;

    const internship = Array.isArray(enrollment.internships)
      ? enrollment.internships[0]
      : enrollment.internships;

    const studentName =
      profile?.full_name?.trim() || "Student";

    const internshipTitle =
      internship?.title?.trim() ||
      "TechDudes Online Internship";

    const startDate = formatDate(
      enrollment.start_date,
    );

    const endDate = formatDate(
      enrollment.end_date,
    );

    const durationDays =
      enrollment.duration_days || 0;

    const dashboardUrl =
      `${SITE_URL}/internship/dashboard`;

    const safeStudentName =
      escapeHtml(studentName);

    const safeInternshipTitle =
      escapeHtml(internshipTitle);

    // --------------------------------------------------------
    // 9. DETERMINE ENROLLMENT DATE
    // --------------------------------------------------------

    const today = getIndiaToday();

    const enrollmentDate =
      getIndiaDateFromTimestamp(
        enrollment.created_at,
      );

    const startsToday =
      enrollment.start_date === today;

    const enrolledToday =
      enrollmentDate === today;

    const enrollmentAndStartSameDay =
      enrollmentDate === enrollment.start_date;

    console.log(
      "Enrollment date check:",
      {
        today,
        enrollment_date: enrollmentDate,
        start_date: enrollment.start_date,
        enrolled_today: enrolledToday,
        starts_today: startsToday,
        enrollment_and_start_same_day:
          enrollmentAndStartSameDay,
      },
    );

    // --------------------------------------------------------
    // 10. DETERMINE EMAIL TYPE
    // --------------------------------------------------------

    let subject: string;
    let startMessageText: string;
    let startMessageHtml: string;

    // ========================================================
    // CASE 1
    // ENROLLMENT DATE == START DATE
    // ========================================================

    if (enrollmentAndStartSameDay) {
      subject =
        "Thank You for Enrolling with TechDudes – You Can Start Now";

      startMessageText = `
Your internship course is open now!

Thank you for enrolling with TechDudes. You can start the course now by accessing your internship dashboard.

Your internship is available from today.
      `.trim();

      startMessageHtml = `
        <div style="
          margin:25px 0;
          padding:20px;
          background:#ecfdf5;
          border-left:4px solid #10b981;
          border-radius:6px;
        ">

          <div style="
            font-size:16px;
            font-weight:700;
            color:#065f46;
            margin-bottom:8px;
          ">
            Your Internship Is Open Now
          </div>

          <div style="
            font-size:15px;
            line-height:1.7;
            color:#334155;
          ">
            Thank you for enrolling with
            <strong>TechDudes</strong>.

            <br /><br />

            <strong>You can start the course now.</strong>

            Your internship course is open and
            available from today.
          </div>

        </div>
      `;
    }

    // ========================================================
    // CASE 2
    // START DATE IS AFTER ENROLLMENT DATE
    // ========================================================

    else {
      subject =
        "Thank You for Enrolling with TechDudes – Your Internship is Confirmed";

      startMessageText = `
Your internship course will open on ${startDate}.

Thank you for enrolling with TechDudes. You will receive another email notification from TechDudes once your internship officially opens.

Until then, your internship course will remain locked until the selected start date.
      `.trim();

      startMessageHtml = `
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
            Your Internship Start Date
          </div>

          <div style="
            font-size:15px;
            line-height:1.7;
            color:#334155;
          ">
            Thank you for enrolling with
            <strong>TechDudes</strong>.

            <br /><br />

            Your internship course will open on
            <strong>${startDate}</strong>.

            <br /><br />

            You will receive another email notification
            from TechDudes once your internship officially
            opens.

            <br /><br />

            Until then, your internship course will remain
            locked until the selected start date.
          </div>

        </div>
      `;
    }

    // --------------------------------------------------------
    // 11. PLAIN TEXT EMAIL
    // --------------------------------------------------------

    const text = `
Dear ${studentName},

Thank you for enrolling with TechDudes!

Your internship enrollment has been successfully confirmed.

INTERNSHIP DETAILS
------------------
Internship: ${internshipTitle}
Start Date: ${startDate}
End Date: ${endDate}
Duration: ${durationDays} days

${startMessageText}

You can access your internship dashboard here:

${dashboardUrl}

We are excited to have you join us and wish you a great learning experience!

Best regards,
TechDudes
Internship & Training Team

https://techdudes.in
    `.trim();

    // --------------------------------------------------------
    // 12. HTML EMAIL
    // --------------------------------------------------------

    const html = `
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Internship Enrollment Confirmed</title>
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
          Enrollment Successful!
        </h1>

        <p style="
          font-size:16px;
          line-height:1.7;
          margin:0 0 18px;
        ">
          Dear <strong>${safeStudentName}</strong>,
        </p>

        <p style="
          font-size:16px;
          line-height:1.7;
          margin:0 0 20px;
        ">
          Thank you for enrolling with
          <strong>TechDudes</strong>.

          Your internship enrollment has been
          successfully confirmed.
        </p>

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
            margin-bottom:18px;
          ">
            Internship Details
          </div>

          <table style="
            width:100%;
            border-collapse:collapse;
            font-size:15px;
          ">

            <tr>
              <td style="
                padding:9px 0;
                color:#64748b;
                width:130px;
              ">
                Internship
              </td>

              <td style="
                padding:9px 0;
                font-weight:600;
                color:#111827;
              ">
                ${safeInternshipTitle}
              </td>
            </tr>

            <tr>
              <td style="
                padding:9px 0;
                color:#64748b;
              ">
                Start Date
              </td>

              <td style="
                padding:9px 0;
                font-weight:600;
                color:#111827;
              ">
                ${startDate}
              </td>
            </tr>

            <tr>
              <td style="
                padding:9px 0;
                color:#64748b;
              ">
                End Date
              </td>

              <td style="
                padding:9px 0;
                font-weight:600;
                color:#111827;
              ">
                ${endDate}
              </td>
            </tr>

            <tr>
              <td style="
                padding:9px 0;
                color:#64748b;
              ">
                Duration
              </td>

              <td style="
                padding:9px 0;
                font-weight:600;
                color:#111827;
              ">
                ${durationDays} days
              </td>
            </tr>

          </table>

        </div>

        <!-- Important Message -->

        ${startMessageHtml}

        <p style="
          font-size:15px;
          line-height:1.7;
          color:#475569;
          margin:25px 0;
        ">
          You can access your internship dashboard
          using the button below.
        </p>

        <!-- Dashboard Button -->

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
          We are excited to have you join us and
          wish you a great learning experience!
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

    // --------------------------------------------------------
    // 13. CHECK RESEND API KEY
    // --------------------------------------------------------

    if (!RESEND_API_KEY) {
      console.error(
        "RESEND_API_KEY is missing",
      );

      return new Response(
        JSON.stringify({
          error:
            "Email service is not configured",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        },
      );
    }

    // --------------------------------------------------------
    // 14. SEND THROUGH RESEND
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // 15. HANDLE RESEND ERROR
    // --------------------------------------------------------

    if (!resendResponse.ok) {
      console.error(
        "Resend error:",
        resendData,
      );

      return new Response(
        JSON.stringify({
          error:
            "Failed to send enrollment email",
          details: resendData,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        },
      );
    }

    // --------------------------------------------------------
    // 16. MARK ENROLLMENT EMAIL AS SENT
    // --------------------------------------------------------

    const enrollmentUpdate: Record<
      string,
      unknown
    > = {
      enrollment_email_sent: true,
      enrollment_email_sent_at:
        new Date().toISOString(),
    };

    // --------------------------------------------------------
    // IMPORTANT:
    // If enrollment date == start date,
    // the student can start immediately.
    //
    // Therefore mark the start email as already handled
    // so the Cron does NOT send a duplicate email.
    // --------------------------------------------------------

    if (enrollmentAndStartSameDay) {
      enrollmentUpdate.start_email_sent = true;

      enrollmentUpdate.start_email_sent_at =
        new Date().toISOString();

      enrollmentUpdate.status =
        "in_progress";
    }

    const {
      error: updateError,
    } = await admin
      .from("enrollments")
      .update(enrollmentUpdate)
      .eq("id", enrollmentId)
      .eq("student_id", user.id);

    // --------------------------------------------------------
    // 17. HANDLE DATABASE UPDATE ERROR
    // --------------------------------------------------------

    if (updateError) {
      console.error(
        "Failed to update enrollment email status:",
        updateError,
      );

      return new Response(
        JSON.stringify({
          status: "sent",

          warning:
            "Email sent successfully, but the enrollment status could not be updated.",

          resend_id:
            resendData?.id ?? null,

          same_day:
            enrollmentAndStartSameDay,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        },
      );
    }

    // --------------------------------------------------------
    // 18. SUCCESS RESPONSE
    // --------------------------------------------------------

    return new Response(
      JSON.stringify({
        status: "sent",

        message:
          enrollmentAndStartSameDay
            ? "Enrollment email sent. Internship can be started now."
            : "Enrollment confirmation email sent. Start-date email will be sent by the scheduled process.",

        enrollment_date:
          enrollmentDate,

        start_date:
          enrollment.start_date,

        same_day:
          enrollmentAndStartSameDay,

        start_email_sent:
          enrollmentAndStartSameDay,

        resend_id:
          resendData?.id ?? null,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      },
    );
  } catch (error) {
    // --------------------------------------------------------
    // 19. UNEXPECTED ERROR
    // --------------------------------------------------------

    console.error(
      "Enrollment confirmation email error:",
      error,
    );

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      },
    );
  }
});