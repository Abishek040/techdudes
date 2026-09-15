import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const VerifyCertificateSearch = () => {
  const [certificateId, setCertificateId] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const id = certificateId.trim().toUpperCase();

    if (!id) {
      return;
    }

    // Send Certificate ID to the verification page
    navigate(`/verify/${encodeURIComponent(id)}`);
  };

  return (
    <div className="min-h-screen px-6 py-32">

      <div className="max-w-2xl mx-auto">

        {/* ==================================================
            MAIN CARD
           ================================================== */}

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden">

          {/* HEADER */}

          <div className="text-center px-8 pt-12 pb-8">

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10">

              <svg
                className="h-10 w-10 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
                />
              </svg>

            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Certificate Verification
            </h1>

            <p className="mt-4 text-white/60">
              Verify the authenticity of a TechDudes
              internship certificate using the Certificate ID.
            </p>

          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="px-8 pb-10"
          >

            <label
              htmlFor="certificateId"
              className="block mb-3 text-sm font-medium text-white/70"
            >
              Certificate ID
            </label>

            <input
              id="certificateId"
              type="text"
              value={certificateId}
              onChange={(event) =>
                setCertificateId(event.target.value)
              }
              placeholder="Example: TD-2026-0005"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/30 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10"
              autoComplete="off"
              spellCheck={false}
            />

            <button
              type="submit"
              disabled={!certificateId.trim()}
              className="mt-5 w-full rounded-xl bg-cyan-400 px-6 py-4 font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Verify Certificate
            </button>

          </form>

          {/* HELP */}

          <div className="border-t border-white/10 px-8 py-7">

            <div className="text-center">

              <p className="text-sm text-white/50">
                Enter the Certificate ID printed on the
                TechDudes internship certificate.
              </p>

              <div className="mt-4 inline-block rounded-lg border border-white/10 bg-white/5 px-4 py-2">

                <span className="text-sm font-mono text-cyan-400">
                  TD-2026-0005
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* QR INFORMATION */}

        <div className="mt-8 text-center">

          <p className="text-sm text-white/40">
            You can also verify a certificate by scanning
            its QR code.
          </p>

        </div>

        {/* BACK */}

        <div className="mt-5 text-center">

          <Link
            to="/internship"
            className="text-sm text-cyan-400 hover:text-cyan-300 transition"
          >
            ← Back to Internships
          </Link>

        </div>

      </div>

    </div>
  );
};

export default VerifyCertificateSearch;