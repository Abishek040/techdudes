import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen text-foreground">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-primary">
            TECHDUDES
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Terms & Conditions
          </h1>

          <p className="mt-3 text-muted-foreground">
            Last updated: September 16, 2026
          </p>
        </div>

        <div className="space-y-8 leading-7 text-muted-foreground">

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              1. Introduction
            </h2>

            <p>
              Welcome to TechDudes. These Terms & Conditions govern your use
              of the TechDudes website, online internship programs, training
              content, assessments, certificate services, and related
              services available through our website.
            </p>

            <p className="mt-3">
              By registering for an account, enrolling in an internship, or
              making a payment through our website, you agree to these Terms
              & Conditions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              2. Internship Programs
            </h2>

            <p>
              TechDudes provides online technical internship and training
              programs in areas including IoT, Embedded Systems and other
              technology domains offered on the website.
            </p>

            <p className="mt-3">
              Each internship may have its own duration, modules,
              assessments, eligibility requirements, certificate requirements,
              and applicable fee.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              3. Registration and Student Account
            </h2>

            <p>
              Students must provide accurate information while creating an
              account, including their name, email address, phone number and
              college information where requested.
            </p>

            <p className="mt-3">
              Students are responsible for maintaining the confidentiality
              of their login credentials and for activities performed through
              their account.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              4. Internship Enrollment and Dates
            </h2>

            <p>
              Students may select an available internship and choose a
              starting date where the program allows date selection.
            </p>

            <p className="mt-3">
              The internship duration and expected completion date are
              determined according to the selected program and the dates
              selected during enrollment.
            </p>

            <p className="mt-3">
              Completing modules or assessments earlier than the selected
              internship period does not automatically change the official
              internship completion date or certificate issue date.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              5. Learning Modules and Assessment
            </h2>

            <p>
              Students must complete the required learning modules and any
              required assessments specified by the selected internship.
            </p>

            <p className="mt-3">
              Where a final quiz or assessment is required, the student must
              achieve the minimum passing score specified for that internship.
            </p>

            <p className="mt-3">
              TechDudes may update, replace, or improve learning materials,
              modules, assessments, and course content when necessary.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              6. Certificate Eligibility
            </h2>

            <p>
              A certificate is issued only when the student satisfies the
              requirements of the selected internship.
            </p>

            <p className="mt-3">
              Depending on the program, certificate eligibility may require
              completion of the required internship duration, completion of
              all required modules, successful completion of the final
              assessment, and successful payment verification.
            </p>

            <p className="mt-3">
              Completing modules or assessments alone does not guarantee
              immediate certificate issuance.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              7. Certificate Fees
            </h2>

            <p>
              Certificate fees are not necessarily the same for every
              internship program.
            </p>

            <p className="mt-3">
              The applicable certificate fee may depend on the selected
              course or internship, number of modules, internship duration,
              assessment requirements, certificate processing requirements,
              and other program-specific factors.
            </p>

            <p className="mt-3">
              The applicable fee will be displayed on the relevant internship
              or payment page before the student makes a payment.
            </p>

            <p className="mt-3">
              At the time of publication of this policy, the certificate fee
              for the <strong className="text-foreground">
                15 Days Online Internship in IoT & Embedded Systems
              </strong>{" "}
              is <strong className="text-foreground">₹199</strong>.
            </p>

            <p className="mt-3">
              Fees may be changed for future or different internship
              programs. The fee applicable to an enrollment will be the fee
              displayed to the student before payment.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              8. Payments
            </h2>

            <p>
              Payments are processed through the payment gateway displayed
              during checkout. TechDudes does not store customers'
              complete card, UPI, or other payment instrument credentials on
              its servers.
            </p>

            <p className="mt-3">
              A payment is considered successfully completed only after the
              payment gateway and TechDudes payment verification process
              confirm the transaction.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              9. Refund and Cancellation
            </h2>

            <p>
              Payments made for certificate issuance are non-refundable after
              successful payment, subject to the terms described in our
              Refund & Cancellation Policy.
            </p>

            <p className="mt-3">
              Students should review the applicable internship details,
              duration, modules, eligibility requirements, and fee before
              making payment.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              10. Certificate Verification
            </h2>

            <p>
              Certificates issued by TechDudes may contain a unique
              certificate number and verification code.
            </p>

            <p className="mt-3">
              Employers, educational institutions, organizations, or other
              parties may verify a certificate through the public certificate
              verification facility provided on the TechDudes website.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              11. Prohibited Activities
            </h2>

            <p>Students must not:</p>

            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Share their account credentials with other individuals.</li>
              <li>Attempt to bypass or manipulate assessments.</li>
              <li>Misrepresent another person's work as their own.</li>
              <li>Attempt to gain unauthorized access to the platform.</li>
              <li>Interfere with the operation or security of the website.</li>
              <li>Use the platform for unlawful activities.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              12. Intellectual Property
            </h2>

            <p>
              Unless otherwise stated, the TechDudes website, branding,
              graphics, course materials, written content, software,
              certificates, and other original materials are owned by or
              licensed to TechDudes.
            </p>

            <p className="mt-3">
              Students may use the provided learning materials for their
              personal educational purposes but may not reproduce, resell,
              redistribute, or commercially exploit them without permission.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              13. Changes to Programs
            </h2>

            <p>
              TechDudes may update internship content, modules, assessments,
              schedules, fees for future enrollments, or other program
              features when necessary.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              14. Account Suspension
            </h2>

            <p>
              TechDudes may suspend or terminate an account if there is
              evidence of misuse, fraudulent activity, unauthorized access,
              violation of these Terms, or other activities that may harm the
              platform or its users.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              15. Contact
            </h2>

            <p>
              For questions regarding these Terms & Conditions, please use
              the contact information available on the TechDudes website.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              16. Acceptance
            </h2>

            <p>
              By using the TechDudes website, registering for an account,
              enrolling in an internship, or making a payment, you confirm
              that you have read and agreed to these Terms & Conditions.
            </p>
          </section>

        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t pt-8">
          <Link
            to="/privacy-policy"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </Link>

          <Link
            to="/refund-policy"
            className="text-primary hover:underline"
          >
            Refund & Cancellation Policy
          </Link>

          <Link
            to="/internship"
            className="text-primary hover:underline"
          >
            Internship Portal
          </Link>
        </div>
      </main>
    </div>
  );
}