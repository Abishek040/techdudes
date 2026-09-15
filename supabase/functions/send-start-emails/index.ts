import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SITE_URL =
      Deno.env.get("SITE_URL") || "https://techdudes.in";

    if (!SUPABASE_URL) {
      throw new Error("SUPABASE_URL is not configured.");
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is not available."
      );
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const today = getIndiaToday();

    // --------------------------------------------------
    // Find internships that should start today
    // --------------------------------------------------
    const { data: enrollments, error: enrollmentError } =
      await supabaseAdmin
        .from("enrollments")
        .select(`
          id,
          student_id,
          internship_id,
          start_date,
          end_date,
          duration_days,
          status,
          start_email_sent
        `)
        .eq("start_date", today)
        .eq("status", "not_started")
        .eq("start_email_sent", false);

    if (enrollmentError) {
      throw enrollmentError;
    }

    if (!enrollments || enrollments.length === 0) {
      return new Response(
        JSON.stringify({
          processed: 0,
          results: [],
          message: "No internships starting today.",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const results = [];

    for (const enrollment of enrollments) {
      try {
        // ------------------------------------------------
        // Get student profile
        // ------------------------------------------------
        const { data: profile, error: profileError } =
          await supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", enrollment.student_id)
            .single();

        if (profileError || !profile) {
          throw new Error(
            profileError?.message ||
              "Student profile not found."
          );
        }

        // ------------------------------------------------
        // Get student email from Auth
        // ------------------------------------------------
        const { data: authUser, error: authError } =
          await supabaseAdmin.auth.admin.getUserById(
            enrollment.student_id
          );

        if (authError || !authUser?.user?.email) {
          throw new Error(
            authError?.message ||
              "Student email address not found."
          );
        }

        const studentEmail = authUser.user.email;

        // ------------------------------------------------
        // Get internship
        // ------------------------------------------------
        const { data: internship, error: internshipError } =
          await supabaseAdmin
            .from("internships")
            .select("title, slug")
            .eq("id", enrollment.internship_id)
            .single();

        if (internshipError || !internship) {
          throw new Error(
            internshipError?.message ||
              "Internship not found."
          );
        }

        const studentName =
          profile.full_name?.trim() || "Student";

        const internshipTitle = internship.title;

        const modulesUrl =
          `${SITE_URL}/internship/modules/${enrollment.id}`;

        // ------------------------------------------------
        // Email HTML
        // ------------------------------------------------
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Your TechDudes Internship Has Started</title>
            </head>

            <body style="
              margin:0;
              padding:0;
              background:#f4f7fb;
              font-family:Arial,Helvetica,sans-serif;
              color:#172033;
            ">
              <div style="
                max-width:620px;
                margin:40px auto;
                background:#ffffff;
                border-radius:14px;
                overflow:hidden;
                box-shadow:0 4px 20px rgba(0,0,0,0.08);
              ">

                <div style="
                  background:#071a33;
                  padding:28px 30px;
                  text-align:center;
                ">
                  <h1 style="
                    margin:0;
                    color:#ffffff;
                    font-size:26px;
                  ">
                    TechDudes
                  </h1>

                  <p style="
                    margin:8px 0 0;
                    color:#b9dfff;
                    font-size:14px;
                  ">
                    Internship Program
                  </p>
                </div>

                <div style="padding:34px 30px;">

                  <h2 style="
                    margin-top:0;
                    font-size:24px;
                    color:#111827;
                  ">
                    Your Internship Has Started!
                  </h2>

                  <p style="font-size:16px;line-height:1.6;">
                    Hello ${escapeHtml(studentName)},
                  </p>

                  <p style="font-size:16px;line-height:1.6;">
                    Your TechDudes internship is officially starting
                    today. Your course content is now available.
                  </p>

                  <div style="
                    background:#f0f8ff;
                    border:1px solid #cce7ff;
                    border-radius:10px;
                    padding:20px;
                    margin:24px 0;
                  ">
                    <p style="margin:0 0 10px;">
                      <strong>Internship:</strong>
                      ${escapeHtml(internshipTitle)}
                    </p>

                    <p style="margin:0 0 10px;">
                      <strong>Start Date:</strong>
                      ${formatDate(enrollment.start_date)}
                    </p>

                    <p style="margin:0;">
                      <strong>End Date:</strong>
                      ${formatDate(enrollment.end_date)}
                    </p>
                  </div>

                  <div style="text-align:center;margin:30px 0;">
                    <a
                      href="${modulesUrl}"
                      style="
                        display:inline-block;
                        background:#0b7cff;
                        color:#ffffff;
                        text-decoration:none;
                        padding:14px 28px;
                        border-radius:8px;
                        font-weight:bold;
                        font-size:16px;
                      "
                    >
                      Start Learning
                    </a>
                  </div>

                  <p style="
                    font-size:14px;
                    line-height:1.6;
                    color:#667085;
                  ">
                    Complete all your internship modules and pass the
                    final assessment. After completing the required
                    steps and once your internship reaches its ending
                    date, your certificate will be processed according
                    to the internship rules.
                  </p>

                  <p style="
                    font-size:15px;
                    line-height:1.6;
                    margin-top:28px;
                  ">
                    Best wishes for your internship!
                  </p>

                  <p style="
                    font-size:15px;
                    line-height:1.6;
                  ">
                    <strong>Team TechDudes</strong>
                  </p>

                </div>

                <div style="
                  background:#f8fafc;
                  padding:18px 30px;
                  text-align:center;
                  color:#98a2b3;
                  font-size:12px;
                ">
                  © ${new Date().getFullYear()} TechDudes
                </div>

              </div>
            </body>
          </html>
        `;

        // ------------------------------------------------
        // Send email through Resend
        // ------------------------------------------------
        const resendResponse = await fetch(
          "https://api.resend.com/emails",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "TechDudes Internship <noreply@techdudes.in>",
              to: [studentEmail],
              subject:
                `Your TechDudes Internship Has Started — ${internshipTitle}`,
              html,
            }),
          }
        );

        const resendData = await resendResponse.json();

        if (!resendResponse.ok) {
          throw new Error(
            resendData?.message ||
              resendData?.error ||
              "Resend failed to send the email."
          );
        }

        // ------------------------------------------------
        // Email succeeded
        // ------------------------------------------------
        const { error: updateError } = await supabaseAdmin
          .from("enrollments")
          .update({
            start_email_sent: true,
            start_email_sent_at: new Date().toISOString(),
            status: "in_progress",
          })
          .eq("id", enrollment.id)
          .eq("start_email_sent", false);

        if (updateError) {
          throw updateError;
        }

        results.push({
          enrollment_id: enrollment.id,
          status: "ok",
          email: studentEmail,
          message: "Start email sent.",
        });
      } catch (error) {
        results.push({
          enrollment_id: enrollment.id,
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});