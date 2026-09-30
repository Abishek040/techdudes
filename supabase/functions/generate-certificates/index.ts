// supabase/functions/generate-certificates/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "https://esm.sh/pdf-lib@1.17.1";
import QRCode from "https://esm.sh/qrcode@1.5.4";
import { corsHeaders } from "../_shared/cors.ts";

// ================================================================
// ENVIRONMENT
// ================================================================

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL")!;

const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const RESEND_API_KEY =
  Deno.env.get("RESEND_API_KEY") ?? "";

const SITE_URL =
  Deno.env.get("SITE_URL") ??
  "https://techdudes.in";

// ================================================================
// MAIN FUNCTION
// ================================================================

Deno.serve(async (req) => {

  // --------------------------------------------------------------
  // CORS
  // --------------------------------------------------------------

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {

    // ------------------------------------------------------------
    // SUPABASE ADMIN CLIENT
    // ------------------------------------------------------------

    const admin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    // ------------------------------------------------------------
    // TODAY
    // ------------------------------------------------------------

    const today = getIndiaToday();

    // ------------------------------------------------------------
    // FIND ELIGIBLE ENROLLMENTS
    // ------------------------------------------------------------

    const {
      data: eligible,
      error,
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
        profiles(full_name),
        internships(title)
      `)
      .eq(
        "modules_completed",
        true
      )
      .eq(
        "quiz_passed",
        true
      )
      .eq(
        "payment_verified",
        true
      )
      .lte(
        "end_date",
        today
      )
      .in(
        "status",
        [
          "completed",
          "certificate_scheduled",
          "certificate_issued",
        ]
      );

    if (error) {
      return json(
        {
          error:
            error.message,
        },
        500
      );
    }

    const results: any[] = [];

    // ============================================================
    // PROCESS EACH ELIGIBLE ENROLLMENT
    // ============================================================

    for (
      const enrollment of eligible ?? []
    ) {

      try {

        // --------------------------------------------------------
        // STUDENT NAME
        // --------------------------------------------------------

        const studentName =
          (enrollment as any)
            .profiles
            ?.full_name
            ?.trim() ||
          "Student";

        // --------------------------------------------------------
        // INTERNSHIP TITLE
        // --------------------------------------------------------

        const internshipTitle =
          (enrollment as any)
            .internships
            ?.title ||
          "Internship";

        // --------------------------------------------------------
        // INTERNSHIP DOMAIN
        // --------------------------------------------------------

        const internshipDomain =
          extractDomain(
            internshipTitle
          );

        // --------------------------------------------------------
        // CHECK EXISTING CERTIFICATE
        // --------------------------------------------------------

        const {
          data:
            existingCertificate,
        } = await admin
          .from("certificates")
          .select("*")
          .eq(
            "enrollment_id",
            enrollment.id
          )
          .maybeSingle();

        if (
          existingCertificate
        ) {
          let retryEmailSent = Boolean(
            existingCertificate.email_sent
          );

          if (
            !retryEmailSent &&
            RESEND_API_KEY
          ) {
            const {
              data: retryAuthUser,
              error: retryAuthError,
            } = await admin.auth.admin.getUserById(
              enrollment.student_id
            );

            if (retryAuthError) {
              console.error(
                "Could not get student account for certificate email retry:",
                retryAuthError.message
              );
            } else {
              const retryStudentEmail =
                retryAuthUser?.user?.email ?? null;

              if (retryStudentEmail) {
                retryEmailSent =
                  await sendCertificateEmail({
                    to: retryStudentEmail,
                    studentName,
                    internshipDomain,
                    startDate: enrollment.start_date,
                    endDate: enrollment.end_date,
                    certificateNumber:
                      existingCertificate.certificate_number,
                    verificationCode:
                      existingCertificate.verification_code,
                    pdfPath:
                      existingCertificate.pdf_path,
                  });

                if (retryEmailSent) {
                  await admin
                    .from("certificates")
                    .update({
                      email_sent: true,
                      email_sent_at:
                        new Date().toISOString(),
                    })
                    .eq(
                      "id",
                      existingCertificate.id
                    );
                }
              }
            }
          }

          results.push({
            enrollment_id:
              enrollment.id,
            status:
              retryEmailSent
                ? "already_exists_email_sent"
                : "already_exists_email_pending",
            certificate_number:
              existingCertificate.certificate_number,
            email_sent:
              retryEmailSent,
          });

          continue;
        }

        // --------------------------------------------------------
        // GET NEXT CERTIFICATE NUMBER
        // --------------------------------------------------------

        const {
          data:
            numberData,
          error:
            numberError,
        } = await admin.rpc(
          "next_certificate_number"
        );

        if (numberError) {
          throw new Error(
            `Certificate number generation failed: ${numberError.message}`
          );
        }

        const certificateNumber =
          String(numberData);

        // --------------------------------------------------------
        // CREATE VERIFICATION CODE
        // --------------------------------------------------------

        const verificationCode =
          crypto
            .randomUUID()
            .replace(
              /-/g,
              ""
            )
            .slice(
              0,
              8
            )
            .toUpperCase();

        // --------------------------------------------------------
        // GET STUDENT EMAIL
        // --------------------------------------------------------

        const {
          data:
            authUser,
          error:
            authError,
        } =
          await admin.auth.admin
            .getUserById(
              enrollment.student_id
            );

        if (authError) {
          throw new Error(
            `Could not get student account: ${authError.message}`
          );
        }

        const studentEmail =
          authUser
            ?.user
            ?.email ??
          null;

        // --------------------------------------------------------
        // BUILD PDF
        // --------------------------------------------------------

        const pdfBytes =
          await buildCertificatePdf({

            studentName,

            internshipDomain,

            startDate:
              enrollment.start_date,

            endDate:
              enrollment.end_date,

            durationDays:
              enrollment.duration_days,

            certificateNumber,

            issueDate:
              enrollment.end_date,

            verificationCode,

          });

        // --------------------------------------------------------
        // PDF PATH
        // --------------------------------------------------------

        const pdfPath =
          `${enrollment.id}/${certificateNumber}.pdf`;

        // --------------------------------------------------------
        // UPLOAD PDF
        // --------------------------------------------------------

        const {
          error:
            uploadError,
        } = await admin.storage
          .from(
            "certificates"
          )
          .upload(
            pdfPath,
            pdfBytes,
            {
              contentType:
                "application/pdf",

              upsert:
                true,
            }
          );

        if (uploadError) {
          throw new Error(
            `Certificate upload failed: ${uploadError.message}`
          );
        }

        // --------------------------------------------------------
        // SAVE CERTIFICATE RECORD
        // --------------------------------------------------------

        const {
          data:
            certificate,
          error:
            insertError,
        } = await admin
          .from(
            "certificates"
          )
          .insert({

            enrollment_id:
              enrollment.id,

            certificate_number:
              certificateNumber,

            verification_code:
              verificationCode,

            issue_date:
              enrollment.end_date,

            pdf_path:
              pdfPath,

            status:
              "issued",

            email_sent:
              false,

          })
          .select()
          .single();

        if (insertError) {
          throw new Error(
            `Certificate database insert failed: ${insertError.message}`
          );
        }

        // --------------------------------------------------------
        // UPDATE ENROLLMENT
        // --------------------------------------------------------

        await admin
          .from(
            "enrollments"
          )
          .update({
            status:
              "certificate_issued",
          })
          .eq(
            "id",
            enrollment.id
          );

        // --------------------------------------------------------
        // SEND EMAIL
        // --------------------------------------------------------

        let emailSent =
          false;

        if (
          studentEmail &&
          RESEND_API_KEY
        ) {

          emailSent =
            await sendCertificateEmail({

              to:
                studentEmail,

              studentName,

              internshipDomain,

              startDate:
                enrollment.start_date,

              endDate:
                enrollment.end_date,

              certificateNumber,

              verificationCode,

              pdfPath,

            });
        }

        // --------------------------------------------------------
        // MARK EMAIL SENT
        // --------------------------------------------------------

        if (emailSent) {

          await admin
            .from(
              "certificates"
            )
            .update({

              email_sent:
                true,

              email_sent_at:
                new Date()
                  .toISOString(),

            })
            .eq(
              "id",
              certificate.id
            );
        }

        // --------------------------------------------------------
        // RESULT
        // --------------------------------------------------------

        results.push({

          enrollment_id:
            enrollment.id,

          status:
            "ok",

          certificate_number:
            certificateNumber,

          email_sent:
            emailSent,

        });

      } catch (error) {

        results.push({

          enrollment_id:
            enrollment.id,

          status:
            "error",

          detail:
            String(error),

        });
      }
    }

    // ------------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------------

    return json({

      processed:
        results.length,

      results,

    });

  } catch (error) {

    return json(
      {
        error:
          String(error),
      },
      500
    );
  }
});

// ================================================================
// BUILD CERTIFICATE PDF
// ================================================================

async function buildCertificatePdf(
  opts: {
    studentName: string;
    internshipDomain: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    certificateNumber: string;
    issueDate: string;
    verificationCode: string;
  }
): Promise<Uint8Array> {

  // ==============================================================
  // SUPABASE ADMIN CLIENT
  // ==============================================================

  const admin =
    createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

  // ==============================================================
  // DOWNLOAD TEMPLATE
  // ==============================================================

  const {
    data:
      templateFile,
    error:
      templateError,
  } = await admin.storage
    .from(
      "certificate-assets"
    )
    .download(
      "certificate-template.png"
    );

  if (
    templateError ||
    !templateFile
  ) {

    console.error(
      "Failed to load certificate template:",
      templateError
    );

    throw new Error(
      "Certificate template could not be loaded from Supabase Storage."
    );
  }

  const templateBytes =
    new Uint8Array(
      await templateFile
        .arrayBuffer()
    );

  // ==============================================================
  // CREATE PDF
  // ==============================================================

  const pdfDoc =
    await PDFDocument.create();

  // A4 LANDSCAPE
  const page =
    pdfDoc.addPage([
      841.89,
      595.28,
    ]);

  const {
    width,
    height,
  } =
    page.getSize();

  // ==============================================================
  // TEMPLATE IMAGE
  // ==============================================================

  const templateImage =
    await pdfDoc.embedPng(
      templateBytes
    );

  page.drawImage(
    templateImage,
    {
      x: 0,
      y: 0,
      width,
      height,
    }
  );

  // ==============================================================
  // FONTS
  // ==============================================================

  const regular =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

  const bold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

  const serifBold =
    await pdfDoc.embedFont(
      StandardFonts.TimesRomanBold
    );

  // ==============================================================
  // NAVY COLOR
  // ==============================================================

  const navy =
    rgb(
      0.03,
      0.10,
      0.25
    );

  // ==============================================================
  // TEMPLATE DIMENSIONS
  // ==============================================================

  const TEMPLATE_WIDTH =
    1491;

  const TEMPLATE_HEIGHT =
    1055;

  // ==============================================================
  // SCALE
  // ==============================================================

  const SX =
    width /
    TEMPLATE_WIDTH;

  const SY =
    height /
    TEMPLATE_HEIGHT;

  // ==============================================================
  // IMAGE X → PDF X
  // ==============================================================

  const imageX = (
    x: number
  ) =>
    x * SX;

  // ==============================================================
  // IMAGE Y → PDF Y
  // ==============================================================

  const imageY = (
    y: number
  ) =>
    height -
    y * SY;

  // ==============================================================
  // CENTER TEXT
  // ==============================================================

  const centerText = (
    text: string,
    centerX: number,
    y: number,
    font: any,
    size: number,
    color = navy
  ) => {

    const textWidth =
      font.widthOfTextAtSize(
        text,
        size
      );

    page.drawText(
      text,
      {
        x:
          centerX -
          textWidth / 2,

        y,

        size,

        font,

        color,
      }
    );
  };

  // ==============================================================
  // FIT FONT SIZE
  // ==============================================================

  const fitFontSize = (
    text: string,
    font: any,
    maxWidth: number,
    preferredSize: number,
    minSize: number
  ) => {

    let size =
      preferredSize;

    while (
      size > minSize &&
      font.widthOfTextAtSize(
        text,
        size
      ) > maxWidth
    ) {

      size -= 1;
    }

    return size;
  };

  // ==============================================================
  // 1. STUDENT NAME
  // ==============================================================

  const studentName =
    opts.studentName.trim();

  const studentFontSize =
    fitFontSize(
      studentName,
      serifBold,

      // Width of name box
      imageX(850),

      25,
      15
    );

  centerText(

    studentName,

    // CENTER
    width / 2,

    // Name vertical position
    imageY(428),

    serifBold,

    studentFontSize
  );

  // ==============================================================
  // 2. 15-DAY INTERNSHIP
  // ==============================================================

  const durationText =
    `${opts.durationDays}-DAY INTERNSHIP`;

  const durationFontSize =
    fitFontSize(
      durationText,
      serifBold,

      imageX(560),

      18,
      12
    );

  centerText(

    durationText,

    // Center of highlighted strip
    width / 2,

    // EXACTLY inside highlighted strip
    imageY(544),

    serifBold,

    durationFontSize
  );

  // ==============================================================
  // 3. INTERNSHIP DOMAIN
  // ==============================================================

  const domainText =
    opts.internshipDomain.trim();

  const domainFontSize =
    fitFontSize(

      domainText,

      serifBold,

      // Domain box width
      imageX(760),

      20,

      11
    );

  centerText(

    domainText,

    // Exact center of domain box
    width / 2,

    // Center vertically inside domain box
    imageY(626),

    serifBold,

    domainFontSize
  );

  // ==============================================================
  // 4. FORMAT DATES
  // ==============================================================

  const startDate =
    formatDate(
      opts.startDate
    );

  const endDate =
    formatDate(
      opts.endDate
    );

  const issueDate =
    formatDate(
      opts.issueDate
    );

  // ==============================================================
  // 5. INTERNSHIP PERIOD
  // ==============================================================
  //
  // The template already contains:
  //
  // INTERNSHIP PERIOD
  //
  // We ONLY draw the actual dates.
  //
  // The dates are placed BELOW the label.
  //
  // ==============================================================

  const periodText =
    `${startDate} — ${endDate}`;

  const periodFontSize =
    fitFontSize(

      periodText,

      bold,

      // Width available inside left box
      imageX(300),

      9.5,

      7
    );

  centerText(

    periodText,

    // Center of LEFT box
    imageX(520),

    // IMPORTANT:
    // Lower than "INTERNSHIP PERIOD"
    imageY(731),

    bold,

    periodFontSize,

    navy
  );

  // ==============================================================
  // 6. DURATION
  // ==============================================================
  //
  // Template already contains:
  //
  // DURATION
  //
  // We draw:
  //
  // 15 DAYS
  //
  // BELOW it.
  //
  // ==============================================================

  const durationDaysText =
    `${opts.durationDays} DAYS`;

  centerText(

    durationDaysText,

    // Center of RIGHT box
    imageX(960),

    // Below DURATION label
    imageY(731),

    bold,

    9.5,

    navy
  );

  // ==============================================================
  // 7. CERTIFICATE ID
  // ==============================================================
  //
  // Template:
  //
  // Certificate ID: __________
  //
  // Put value ON the line.
  //
  // ==============================================================

  const certificateIdFontSize =
    fitFontSize(

      opts.certificateNumber,

      bold,

      imageX(125),

      8.5,

      7
    );

  page.drawText(

    opts.certificateNumber,

    {
      // Start on the certificate ID dash
      x:
        imageX(1300),

      // MOVED DOWN onto the line
      y:
        imageY(882),

      size:
        certificateIdFontSize,

      font:
        bold,

      color:
        navy,
    }
  );

  // ==============================================================
  // 8. ISSUE DATE
  // ==============================================================
  //
  // Template:
  //
  // Issue Date: __________
  //
  // Put value ON the line.
  //
  // ==============================================================

  const issueDateFontSize =
    fitFontSize(

      issueDate,

      bold,

      imageX(125),

      8.5,

      7
    );

  page.drawText(

    issueDate,

    {
      // Start on Issue Date dash
      x:
        imageX(1300),

      // MOVED DOWN onto the line
      y:
        imageY(918),

      size:
        issueDateFontSize,

      font:
        bold,

      color:
        navy,
    }
  );

  // ==============================================================
  // 9. QR CODE
  // ==============================================================
  //
  // QR verification URL:
  //
  // https://techdudes.in/verify/CODE
  //
  // ==============================================================

  const verificationUrl =
    `${SITE_URL}/verify/${opts.verificationCode}`;

  const qrPng =
    await QRCode.toBuffer(

      verificationUrl,

      {
        type:
          "png",

        width:
          400,

        // No extra white border
        margin:
          0,

        errorCorrectionLevel:
          "H",
      }
    );

  const qrImage =
    await pdfDoc.embedPng(
      qrPng
    );

  // ==============================================================
  // 10. QR POSITION
  // ==============================================================
  //
  // BOTTOM-LEFT EMPTY QR BOX
  //
  // Template coordinates approximately:
  //
  // X: 55 → 171
  // Y: 774 → 887
  //
  // ==============================================================

  const QR_X = 66;
  const QR_Y = 800;
  const QR_SIZE = 114;

  page.drawImage(qrImage, {
    x: imageX(QR_X),
    y: imageY(QR_Y + QR_SIZE),
    width: imageX(QR_SIZE),
    height: QR_SIZE * SY,
  });

  // ==============================================================
  // SAVE PDF
  // ==============================================================

  return await pdfDoc.save();
}

// ================================================================
// INDIA DATE
// ================================================================

function getIndiaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// ================================================================
// HTML ESCAPE
// ================================================================

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ================================================================
// EXTRACT INTERNSHIP DOMAIN
// ================================================================

function extractDomain(
  internshipTitle: string
): string {

  const match =
    internshipTitle.match(
      /\bin\s+(.+)$/i
    );

  if (
    match?.[1]
  ) {

    return match[1].trim();
  }

  return internshipTitle.trim();
}

// ================================================================
// FORMAT DATE
// ================================================================

function formatDate(
  dateString: string
): string {

  const date =
    new Date(
      `${dateString}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return dateString;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  );
}

// ================================================================
// SEND CERTIFICATE EMAIL
// ================================================================

async function sendCertificateEmail(
  opts: {
    to: string;
    studentName: string;
    internshipDomain: string;
    startDate: string;
    endDate: string;
    certificateNumber: string;
    verificationCode: string;
    pdfPath: string;
  }
): Promise<boolean> {

  const verifyLink =
    `${SITE_URL}/verify/${opts.verificationCode}`;

  const admin =
    createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

  const {
    data: pdfFile,
    error: pdfDownloadError,
  } = await admin.storage
    .from("certificates")
    .download(opts.pdfPath);

  if (pdfDownloadError || !pdfFile) {
    console.error(
      "Could not download certificate PDF for email:",
      pdfDownloadError?.message ?? "PDF file not found"
    );
    return false;
  }

  const pdfBytes =
    new Uint8Array(
      await pdfFile.arrayBuffer()
    );

  let binary = "";
  const chunkSize = 0x8000;

  for (
    let i = 0;
    i < pdfBytes.length;
    i += chunkSize
  ) {
    binary += String.fromCharCode(
      ...pdfBytes.subarray(
        i,
        Math.min(i + chunkSize, pdfBytes.length)
      )
    );
  }

  const pdfBase64 = btoa(binary);

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#172033;line-height:1.6">
      <div style="background:#061a38;padding:28px 32px;text-align:center;border-radius:12px 12px 0 0">
        <div style="font-size:28px;font-weight:700;color:#ffffff">TechDudes</div>
        <div style="color:#b9d9ff;margin-top:6px">Internship Program</div>
      </div>
      <div style="padding:32px;background:#ffffff;border:1px solid #e5eaf2;border-top:0;border-radius:0 0 12px 12px">
        <h2 style="margin-top:0;color:#111827">Your Internship Certificate is Ready!</h2>
        <p>Dear ${escapeHtml(opts.studentName)},</p>
        <p>Congratulations! You have successfully completed your TechDudes internship.</p>
        <div style="background:#f4f8ff;border:1px solid #cfe2ff;border-radius:10px;padding:18px;margin:22px 0">
          <p style="margin:0 0 8px"><strong>Internship Domain:</strong> ${escapeHtml(opts.internshipDomain)}</p>
          <p style="margin:0 0 8px"><strong>Internship Period:</strong> ${formatDate(opts.startDate)} — ${formatDate(opts.endDate)}</p>
          <p style="margin:0"><strong>Certificate ID:</strong> ${escapeHtml(opts.certificateNumber)}</p>
        </div>
        <p>Your certificate PDF is attached to this email.</p>
        <p style="margin:26px 0"><a href="${verifyLink}" style="display:inline-block;background:#0b67f0;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700">Verify Certificate</a></p>
        <p style="font-size:13px;color:#667085">You can also verify the certificate using certificate ID <strong>${escapeHtml(opts.certificateNumber)}</strong> on the TechDudes verification page.</p>
        <p style="margin-bottom:0">Regards,<br /><strong>TechDudes</strong><br />${SITE_URL}</p>
      </div>
    </div>
  `;

  const textBody =
`Dear ${opts.studentName},

Congratulations! You have successfully completed your TechDudes internship.

Internship Domain:
${opts.internshipDomain}

Internship Period:
${formatDate(opts.startDate)} — ${formatDate(opts.endDate)}

Certificate ID:
${opts.certificateNumber}

Your certificate PDF is attached to this email.

Verify your certificate:
${verifyLink}

Regards,
TechDudes
${SITE_URL}`;

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TechDudes <certificates@techdudes.in>",
          to: [opts.to],
          subject: "Your TechDudes Internship Certificate is Ready",
          html,
          text: textBody,
          attachments: [
            {
              filename: `${opts.certificateNumber}.pdf`,
              content: pdfBase64,
            },
          ],
        }),
      }
    );

  if (!response.ok) {
    console.error(
      "Resend email failed:",
      await response.text()
    );
    return false;
  }

  return true;
}

// ================================================================
// JSON RESPONSE
// ================================================================

function json(
  body: unknown,
  status = 200
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
    }
  );
}