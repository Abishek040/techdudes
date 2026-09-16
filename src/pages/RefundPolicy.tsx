import { Link } from "react-router-dom";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen text-foreground">
      <main className="mx-auto max-w-4xl px-6 py-16">

        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-primary">
            TECHDUDES
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Refund & Cancellation Policy
          </h1>

          <p className="mt-3 text-muted-foreground">
            Last updated: September 16, 2026
          </p>
        </div>

        <div className="space-y-8 leading-7 text-muted-foreground">

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              1. Overview
            </h2>

            <p>
              This Refund & Cancellation Policy applies to payments made
              through the TechDudes website for internship certificate
              issuance and related services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              2. Certificate Fees
            </h2>

            <p>
              Certificate fees vary depending on the selected internship or
              course, number of modules, internship duration, assessment
              requirements, and other program-specific requirements.
            </p>

            <p className="mt-3">
              The applicable fee is displayed to the student before payment.
            </p>

            <p className="mt-3">
              The current certificate fee for the
              <strong className="text-foreground">
                {" "}15 Days Online Internship in IoT & Embedded Systems
              </strong>{" "}
              is <strong className="text-foreground">₹199</strong>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              3. Non-Refundable Payments
            </h2>

            <p>
              All certificate payments are non-refundable after the payment
              has been successfully completed and verified.
            </p>

            <p className="mt-3">
              By proceeding with payment, the student confirms that they have
              reviewed the selected internship, duration, requirements,
              applicable certificate fee, and this Refund & Cancellation
              Policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              4. Non-Refundable Situations
            </h2>

            <p>
              A refund will not normally be provided in situations including:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                The student changes their mind after completing payment.
              </li>

              <li>
                The student does not complete the required internship
                modules.
              </li>

              <li>
                The student does not pass the required assessment.
              </li>

              <li>
                The student does not complete the required internship
                duration.
              </li>

              <li>
                The student fails to meet the certificate eligibility
                requirements.
              </li>

              <li>
                The student does not use the internship platform after
                making payment.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              5. Cancellation
            </h2>

            <p>
              Students may stop participating in an internship program at any
              time. However, cancellation or discontinuation of participation
              after successful certificate payment does not create an
              entitlement to a refund.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              6. Failed or Duplicate Payments
            </h2>

            <p>
              If a payment fails but an amount is temporarily debited from
              the student's bank account, the payment may be subject to the
              payment gateway's normal reversal or settlement process.
            </p>

            <p className="mt-3">
              If a student believes that the same transaction was charged
              more than once, they should contact TechDudes with the
              transaction details so that the payment records can be checked.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              7. Technical Issues
            </h2>

            <p>
              If a verified payment is successfully received but the
              student's payment status is not updated because of a technical
              issue, the student should contact TechDudes with the payment
              transaction details.
            </p>

            <p className="mt-3">
              TechDudes may investigate the transaction and update the
              payment status where the payment has been successfully
              confirmed.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              8. Contact for Payment Issues
            </h2>

            <p>
              For payment-related issues, students should provide their
              registered email address, internship information, payment
              date, amount, and transaction/reference details when contacting
              TechDudes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              9. Policy Changes
            </h2>

            <p>
              TechDudes may update this policy when necessary. The updated
              policy will be published on this page.
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
            to="/privacy-policy"
            className="text-primary hover:underline"
          >
            Privacy Policy
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