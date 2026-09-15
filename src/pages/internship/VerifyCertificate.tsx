import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

// ============================================================
// TYPE
// ============================================================

type VerificationResult = {
  student_name: string;
  college: string;
  email: string;
  internship_title: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  certificate_number: string;
  issue_date: string;
  verification_code: string;
  certificate_status: string;
};

// ============================================================
// DATE FORMAT
// ============================================================

const formatDate = (date: string | null | undefined) => {
  if (!date) return "—";

  const d = new Date(`${date}T00:00:00`);

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
// VERIFY CERTIFICATE
// ============================================================

const VerifyCertificate = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [input, setInput] = useState(code ?? "");
  const [loading, setLoading] = useState(!!code);
  const [error, setError] = useState("");

  const [certificate, setCertificate] =
    useState<VerificationResult | null>(null);

  // Keep input synchronized with URL
  useEffect(() => {
    setInput(code ?? "");
  }, [code]);

  // ============================================================
  // VERIFY
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const verifyCertificate = async () => {
      // IMPORTANT:
      // /verify without a code should show the search form,
      // not "Certificate Not Verified".
      if (!code) {
        if (mounted) {
          setLoading(false);
          setError("");
          setCertificate(null);
        }

        return;
      }

      try {
        setLoading(true);
        setError("");
        setCertificate(null);

        // ========================================================
        // VALUE FROM URL
        // ========================================================

        const identifier = decodeURIComponent(code)
          .trim()
          .toUpperCase();

        if (!identifier) {
          if (mounted) {
            setError(
              "Please provide a valid Certificate ID."
            );

            setLoading(false);
          }

          return;
        }

        // ========================================================
        // PUBLIC CERTIFICATE VERIFICATION
        // ========================================================

        const {
          data,
          error: verificationError,
        } = await supabase.rpc(
          "verify_certificate",
          {
            p_identifier: identifier,
          }
        );

        // ========================================================
        // DATABASE ERROR
        // ========================================================

        if (verificationError) {
          console.error(
            "Certificate verification error:",
            verificationError
          );

          if (mounted) {
            setError(
              "Unable to verify this certificate. Please try again."
            );

            setLoading(false);
          }

          return;
        }

        // ========================================================
        // NO RESULT
        // ========================================================

        if (!data || data.length === 0) {
          if (mounted) {
            setError(
              identifier.startsWith("TD-")
                ? "Certificate ID not found. Please check the Certificate ID and try again."
                : "Verification code not found. Please check the verification code and try again."
            );

            setLoading(false);
          }

          return;
        }

        // ========================================================
        // SUCCESS
        // ========================================================

        if (mounted) {
          setCertificate(
            data[0] as VerificationResult
          );

          setLoading(false);
        }
      } catch (err) {
        console.error(
          "Unexpected verification error:",
          err
        );

        if (mounted) {
          setError(
            "An unexpected error occurred while verifying the certificate."
          );

          setLoading(false);
        }
      }
    };

    verifyCertificate();

    return () => {
      mounted = false;
    };
  }, [code]);

  // ============================================================
  // SEARCH PAGE
  // ============================================================

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-32">
        <div className="w-full max-w-2xl">

          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden">

            {/* HEADER */}

            <div className="text-center px-8 pt-10 pb-8">

              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10">
                <span className="text-4xl text-cyan-400">
                  ✓
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Verify a TechDudes Certificate
              </h1>

              <p className="mt-3 text-white/60">
                Enter the Certificate ID or Verification Code
                to verify the certificate.
              </p>

            </div>

            {/* SEARCH */}

            <div className="px-8 pb-10">

              <label className="block text-sm text-white/60 mb-2">
                Certificate ID or Verification Code
              </label>

              <div className="flex flex-col sm:flex-row gap-3">

                <input
                  type="text"
                  value={input}
                  onChange={(e) =>
                    setInput(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const identifier =
                        input.trim();

                      if (!identifier) return;

                      navigate(
                        `/verify/${encodeURIComponent(
                          identifier
                        )}`
                      );
                    }
                  }}
                  placeholder="Example: TD-2026-0011"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                />

                <button
                  type="button"
                  disabled={!input.trim()}
                  onClick={() => {
                    const identifier =
                      input.trim();

                    if (!identifier) return;

                    navigate(
                      `/verify/${encodeURIComponent(
                        identifier
                      )}`
                    );
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-7 py-3 font-semibold text-black hover:bg-cyan-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Verify Certificate
                </button>

              </div>

              <p className="mt-5 text-center text-sm text-white/40">
                This certificate verification service is
                publicly accessible without logging in.
              </p>

            </div>

          </div>

        </div>
      </div>
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-32">

        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-10 text-center">

          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />

          <p className="text-lg text-white/70">
            Verifying certificate...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-32">

        <div className="w-full max-w-2xl rounded-2xl border border-red-500/20 bg-black/30 backdrop-blur-xl p-10 text-center">

          <div className="text-5xl mb-5">
            ❌
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Certificate Not Verified
          </h1>

          <p className="text-white/60 mb-8">
            {error ||
              "This certificate could not be verified."}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">

            <Link
              to="/verify"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
            >
              Verify Another Certificate
            </Link>

            <Link
              to="/internship"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black hover:bg-cyan-300 transition"
            >
              Back to Internships
            </Link>

          </div>

        </div>

      </div>
    );
  }

  // ============================================================
  // VERIFIED CERTIFICATE
  // ============================================================

  return (
    <div className="min-h-screen px-6 py-32">

      <div className="max-w-3xl mx-auto">

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden">

          {/* ==================================================
              HEADER
             ================================================== */}

          <div className="text-center px-8 pt-10 pb-8">

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-green-400/30 bg-green-400/10">

              <span className="text-4xl text-green-400">
                ✓
              </span>

            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Certificate Verified
            </h1>

            <p className="mt-3 text-white/60">
              This certificate is officially issued by TechDudes.
            </p>

          </div>

          {/* ==================================================
              STATUS
             ================================================== */}

          <div className="mx-8 rounded-xl border border-green-400/20 bg-green-400/5 p-5 text-center">

            <p className="text-sm text-white/50">
              Certificate Status
            </p>

            <p className="mt-1 text-xl font-bold text-green-400">
              VERIFIED
            </p>

          </div>

          {/* ==================================================
              DETAILS
             ================================================== */}

          <div className="p-8 space-y-5">

            <InfoRow
              label="Student Name"
              value={certificate.student_name}
            />

            <InfoRow
              label="College"
              value={certificate.college || "—"}
            />

            <InfoRow
              label="Email"
              value={certificate.email || "—"}
            />

            <InfoRow
              label="Internship"
              value={certificate.internship_title}
            />

            <InfoRow
              label="Starting Date"
              value={formatDate(certificate.start_date)}
            />

            <InfoRow
              label="Ending Date"
              value={formatDate(certificate.end_date)}
            />

            <InfoRow
              label="Duration"
              value={`${certificate.duration_days} Days`}
            />

            <InfoRow
              label="Certificate ID"
              value={certificate.certificate_number}
            />

            <InfoRow
              label="Issue Date"
              value={formatDate(certificate.issue_date)}
            />

            <InfoRow
              label="Verification Code"
              value={certificate.verification_code}
            />

          </div>

          {/* ==================================================
              FOOTER
             ================================================== */}

          <div className="border-t border-white/10 px-8 py-7 text-center">

            <Link
              to="/verify"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black hover:bg-cyan-300 transition"
            >
              Verify Another Certificate
            </Link>

            <p className="mt-5 text-sm text-white/50">
              This certificate can be publicly verified without
              logging in.
            </p>

            <p className="mt-2 text-xs text-white/30">
              TechDudes • Internship Certification
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

// ============================================================
// INFO ROW
// ============================================================

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="flex flex-col gap-1 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">

      <span className="text-sm text-white/50">
        {label}
      </span>

      <span className="text-sm font-semibold text-white sm:text-right break-all">
        {value}
      </span>

    </div>
  );
};

export default VerifyCertificate;