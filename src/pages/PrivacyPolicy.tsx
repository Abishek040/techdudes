import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen text-foreground">
      <main className="mx-auto max-w-4xl px-6 py-16">

        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-primary">
            TECHDUDES
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Privacy Policy
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
              TechDudes respects your privacy and is committed to protecting
              the personal information provided by students, customers and
              visitors using our website.
            </p>

            <p className="mt-3">
              This Privacy Policy explains what information we collect, why
              we collect it, how it is used, and how it may be protected.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              2. Information We Collect
            </h2>

            <p>Depending on how you use our services, we may collect:</p>

            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>College or institution information</li>
              <li>Account and authentication information</li>
              <li>Internship enrollment information</li>
              <li>Selected internship dates</li>
              <li>Module completion information</li>
              <li>Quiz and assessment results</li>
              <li>Certificate information</li>
              <li>Payment transaction and payment status information</li>
              <li>Technical and website usage information</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              3. How We Use Information
            </h2>

            <p>Information may be used to:</p>

            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Create and manage student accounts.</li>
              <li>Process internship enrollments.</li>
              <li>Track internship progress.</li>
              <li>Conduct assessments and quizzes.</li>
              <li>Determine certificate eligibility.</li>
              <li>Generate and verify certificates.</li>
              <li>Process and verify payments.</li>
              <li>Send important service-related communications.</li>
              <li>Improve website functionality and services.</li>
              <li>Prevent fraud, misuse and unauthorized access.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              4. Payment Information
            </h2>

            <p>
              Payments are processed through third-party payment gateway
              providers. TechDudes does not intentionally store complete
              payment card numbers, CVV information, UPI credentials, or
              other sensitive payment instrument credentials on its own
              servers.
            </p>

            <p className="mt-3">
              We may receive transaction information such as payment status,
              transaction identifiers, amount, and payment-related reference
              information required to confirm an internship certificate
              payment.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              5. Service Providers
            </h2>

            <p>
              TechDudes may use third-party service providers for services
              such as authentication, database hosting, payment processing,
              email delivery, website hosting, analytics, or other technical
              functions required to operate the platform.
            </p>

            <p className="mt-3">
              These providers may process information only as required for
              the services they provide and according to their applicable
              terms and privacy policies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              6. Certificate Information
            </h2>

            <p>
              Certificate information may include the student's name,
              internship title, duration, internship dates, certificate
              number, issue date, and verification code.
            </p>

            <p className="mt-3">
              Certificate verification information may be made publicly
              accessible through our certificate verification system so that
              employers, institutions, and other authorized parties can
              verify the authenticity of a certificate.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              7. Data Security
            </h2>

            <p>
              We take reasonable technical and organizational measures to
              protect information against unauthorized access, alteration,
              disclosure, or destruction.
            </p>

            <p className="mt-3">
              However, no internet-based service can guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              8. Data Retention
            </h2>

            <p>
              We may retain account, enrollment, assessment, payment
              verification, and certificate information for as long as
              reasonably necessary to operate the service, maintain records,
              provide certificate verification, resolve disputes, comply
              with legal obligations, and prevent fraud or misuse.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              9. Cookies and Technical Information
            </h2>

            <p>
              Our website and supporting services may use cookies, local
              storage, session information, logs, or similar technologies to
              maintain authentication, security, preferences, and website
              functionality.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              10. Children's Privacy
            </h2>

            <p>
              Our services are intended for individuals who are legally
              permitted to use online educational and internship services.
              We do not knowingly collect personal information from children
              where collection is prohibited by applicable law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              11. Third-Party Links
            </h2>

            <p>
              Our website may contain links to third-party websites or
              services. TechDudes is not responsible for the privacy practices
              or content of third-party websites.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              12. Changes to this Privacy Policy
            </h2>

            <p>
              We may update this Privacy Policy when our services,
              technologies, or legal requirements change. Updated versions
              will be published on this page.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              13. Contact
            </h2>

            <p>
              If you have questions regarding this Privacy Policy or your
              personal information, please contact TechDudes through the
              contact information provided on our website.
            </p>
          </section>

        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t pt-8">
          <Link
            to="/terms"
            className="text-primary hover:underline"
          >
            Terms & Conditions
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