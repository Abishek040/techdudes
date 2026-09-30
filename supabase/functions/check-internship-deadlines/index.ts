import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL")!;

const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const RESEND_API_KEY =
  Deno.env.get("RESEND_API_KEY") ?? "";

const SITE_URL =
  Deno.env.get("SITE_URL") ?? "https://techdudes.in";


Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {

    const admin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    /*
     * ------------------------------------------------------------
     * TODAY
     * ------------------------------------------------------------
     */

    const today = new Date();

    const todayString =
      today.toISOString().slice(0, 10);


    /*
     * ------------------------------------------------------------
     * LOAD ACTIVE ENROLLMENTS
     * ------------------------------------------------------------
     */

    const {
      data: enrollments,
      error: enrollmentError,
    } = await admin
      .from("enrollments")
      .select(`
        id,
        student_id,
        internship_id,
        start_date,
        end_date,
        duration_days,
        status,
        modules_completed,
        quiz_passed,
        payment_verified,
        reminder_3_days_sent,
        reminder_1_day_sent,
        expiry_email_sent,
        profiles(full_name),
        internships(title)
      `)
      .neq("status", "certificate_issued")
      .neq("status", "expired");


    if (enrollmentError) {

      return json(
        {
          error: enrollmentError.message,
        },
        500
      );

    }


    const results: any[] = [];


    /*
     * ------------------------------------------------------------
     * PROCESS EACH ENROLLMENT
     * ------------------------------------------------------------
     */

    for (const enrollment of enrollments ?? []) {

      try {

        const endDate =
          new Date(
            `${enrollment.end_date}T00:00:00`
          );


        const diffMs =
          endDate.getTime() -
          new Date(`${todayString}T00:00:00`).getTime();


        const daysRemaining =
          Math.round(
            diffMs /
            (1000 * 60 * 60 * 24)
          );


        /*
         * --------------------------------------------------------
         * CHECK COMPLETION
         * --------------------------------------------------------
         */

        const fullyCompleted =
          enrollment.modules_completed === true &&
          enrollment.quiz_passed === true &&
          enrollment.payment_verified === true;


        /*
         * --------------------------------------------------------
         * IF EVERYTHING IS COMPLETE
         * --------------------------------------------------------
         */

        if (fullyCompleted) {

          results.push({
            enrollment_id: enrollment.id,
            action: "ready_for_certificate",
            days_remaining: daysRemaining,
          });

          continue;

        }


        /*
         * --------------------------------------------------------
         * GET STUDENT EMAIL
         * --------------------------------------------------------
         */

        const {
          data: authUser,
          error: authError,
        } = await admin.auth.admin.getUserById(
          enrollment.student_id
        );


        if (authError) {

          results.push({
            enrollment_id: enrollment.id,
            action: "email_lookup_failed",
            error: authError.message,
          });

          continue;

        }


        const studentEmail =
          authUser?.user?.email ?? null;


        const studentName =
          (enrollment as any)
            .profiles
            ?.full_name
            ?.trim() ||
          "Student";


        const internshipTitle =
          (enrollment as any)
            .internships
            ?.title ||
          "Internship";


        /*
         * --------------------------------------------------------
         * 3-DAY REMINDER
         * --------------------------------------------------------
         */

        if (
          daysRemaining === 3 &&
          !enrollment.reminder_3_days_sent
        ) {

          let emailSent = false;


          if (
            studentEmail &&
            RESEND_API_KEY
          ) {

            emailSent =
              await sendReminderEmail({
                to: studentEmail,
                studentName,
                internshipTitle,
                endDate: enrollment.end_date,
                daysRemaining: 3,
                siteUrl: SITE_URL,
              });

          }


          if (emailSent) {

            await admin
              .from("enrollments")
              .update({
                reminder_3_days_sent: true,
              })
              .eq(
                "id",
                enrollment.id
              );

          }


          results.push({
            enrollment_id: enrollment.id,
            action: emailSent
              ? "3_day_reminder_sent"
              : "3_day_reminder_not_sent",
          });


          continue;

        }


        /*
         * --------------------------------------------------------
         * 1-DAY REMINDER
         * --------------------------------------------------------
         */

        if (
          daysRemaining === 1 &&
          !enrollment.reminder_1_day_sent
        ) {

          let emailSent = false;


          if (
            studentEmail &&
            RESEND_API_KEY
          ) {

            emailSent =
              await sendReminderEmail({
                to: studentEmail,
                studentName,
                internshipTitle,
                endDate: enrollment.end_date,
                daysRemaining: 1,
                siteUrl: SITE_URL,
              });

          }


          if (emailSent) {

            await admin
              .from("enrollments")
              .update({
                reminder_1_day_sent: true,
              })
              .eq(
                "id",
                enrollment.id
              );

          }


          results.push({
            enrollment_id: enrollment.id,
            action: emailSent
              ? "1_day_reminder_sent"
              : "1_day_reminder_not_sent",
          });


          continue;

        }


        /*
         * --------------------------------------------------------
         * EXPIRE AFTER END DATE
         * --------------------------------------------------------
         */

        if (daysRemaining < 0) {

          const {
            error: expiryError,
          } = await admin
            .from("enrollments")
            .update({
              status: "expired",
            })
            .eq(
              "id",
              enrollment.id
            );


          if (expiryError) {

            results.push({
              enrollment_id: enrollment.id,
              action: "expiry_update_failed",
              error: expiryError.message,
            });

            continue;

          }


          /*
           * ------------------------------------------------------
           * SEND EXPIRY EMAIL
           * ------------------------------------------------------
           */

          let emailSent = false;


          if (
            studentEmail &&
            RESEND_API_KEY &&
            !enrollment.expiry_email_sent
          ) {

            emailSent =
              await sendExpiryEmail({
                to: studentEmail,
                studentName,
                internshipTitle,
                endDate: enrollment.end_date,
                siteUrl: SITE_URL,
              });

          }


          if (emailSent) {

            await admin
              .from("enrollments")
              .update({
                expiry_email_sent: true,
              })
              .eq(
                "id",
                enrollment.id
              );

          }


          results.push({
            enrollment_id: enrollment.id,
            action: "expired",
            email_sent: emailSent,
          });

        }

      } catch (error) {

        results.push({
          enrollment_id: enrollment.id,
          action: "error",
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });

      }

    }


    return json({
      success: true,
      today: todayString,
      processed: results.length,
      results,
    });

  } catch (error) {

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      500
    );

  }

});


/*
 * ================================================================
 * 3-DAY / 1-DAY REMINDER EMAIL
 * ================================================================
 */

async function sendReminderEmail({
  to,
  studentName,
  internshipTitle,
  endDate,
  daysRemaining,
  siteUrl,
}: {
  to: string;
  studentName: string;
  internshipTitle: string;
  endDate: string;
  daysRemaining: number;
  siteUrl: string;
}) {

  if (!RESEND_API_KEY) {
    return false;
  }


  const subject =
    daysRemaining === 3
      ? "Your TechDudes Internship Ends in 3 Days"
      : "Final Reminder: Your TechDudes Internship Ends Tomorrow";


  const message =
    daysRemaining === 3
      ? `
Hello ${studentName},

This is a reminder that your TechDudes internship is scheduled to end on ${formatDate(endDate)}.

You have 3 days remaining to complete all required activities.

Internship:
${internshipTitle}

Please complete any remaining:

• Internship modules
• Module quizzes
• Final assessment
• Certificate payment

Your internship deadline is:

${formatDate(endDate)}

Please complete the pending requirements before the deadline.

Login to your TechDudes internship portal:
${siteUrl}/internship

Regards,
TechDudes
      `.trim()
      :
      `
Hello ${studentName},

This is your final reminder.

Your TechDudes internship ends tomorrow on ${formatDate(endDate)}.

Please complete all remaining:

• Internship modules
• Module quizzes
• Final assessment
• Certificate payment

After the deadline, an incomplete internship will be marked as EXPIRED and certificate issuance will not be available for that enrollment.

Login now:
${siteUrl}/internship

Regards,
TechDudes
      `.trim();


  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${RESEND_API_KEY}`,
        },

        body: JSON.stringify({

          from:
            "TechDudes <onboarding@resend.dev>",

          to: [to],

          subject,

          text: message,

        }),
      }
    );


  return response.ok;

}


/*
 * ================================================================
 * EXPIRY EMAIL
 * ================================================================
 */

async function sendExpiryEmail({
  to,
  studentName,
  internshipTitle,
  endDate,
  siteUrl,
}: {
  to: string;
  studentName: string;
  internshipTitle: string;
  endDate: string;
  siteUrl: string;
}) {

  if (!RESEND_API_KEY) {
    return false;
  }


  const message = `
Hello ${studentName},

Your TechDudes internship has now expired.

Internship:
${internshipTitle}

Deadline:
${formatDate(endDate)}

Unfortunately, the required internship activities were not completed before the selected deadline.

The enrollment has therefore been marked as:

COURSE EXPIRED

Certificate issuance is not available for this expired enrollment.

If you have questions, please contact TechDudes support.

${siteUrl}

Regards,
TechDudes
  `.trim();


  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${RESEND_API_KEY}`,
        },

        body: JSON.stringify({

          from:
            "TechDudes <onboarding@resend.dev>",

          to: [to],

          subject:
            "Your TechDudes Internship Has Expired",

          text: message,

        }),
      }
    );


  return response.ok;

}


/*
 * ================================================================
 * DATE FORMAT
 * ================================================================
 */

function formatDate(
  value: string
) {

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

}


/*
 * ================================================================
 * JSON RESPONSE
 * ================================================================
 */

function json(
  data: unknown,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    }
  );

}