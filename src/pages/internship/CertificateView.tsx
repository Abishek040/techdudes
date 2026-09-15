import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import type { Certificate, Enrollment } from "@/types/internship";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "qrcode";
import useInternshipBackToDashboard from "@/hooks/useInternshipBackToDashboard";
const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://techdudes.in";

const CertificateView = () => {
  const { enrollmentId } = useParams();
  useInternshipBackToDashboard();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: enr } = await supabase.from("enrollments").select("*, internships(*)").eq("id", enrollmentId).single();
      setEnrollment(enr as Enrollment);

      const { data: cert } = await supabase.from("certificates").select("*").eq("enrollment_id", enrollmentId).single();
      setCertificate(cert as Certificate);

      if (cert?.pdf_path) {
        const { data: pub } = supabase.storage.from("certificates").getPublicUrl(cert.pdf_path);
        setPdfUrl(pub.publicUrl);
      }
      if (cert?.verification_code) {
        const link = `${SITE_URL}/verify/${cert.verification_code}`;
        setQrDataUrl(await QRCode.toDataURL(link));
      }
      setLoading(false);
    })();
  }, [enrollmentId]);

  if (loading) return <div className="pt-32 text-center text-muted-foreground">Loading…</div>;

  if (!certificate) {
    return (
      <div className="pt-32 text-center text-muted-foreground px-6">
        Your certificate hasn't been issued yet. It will be generated automatically on your internship's ending
        date.
      </div>
    );
  }

  const verifyLink = `${SITE_URL}/verify/${certificate.verification_code}`;

  return (
    <div className="pt-32 pb-24 max-w-2xl mx-auto px-6">
      <Card className="border-glass-border bg-glass/40 backdrop-blur">
        <CardHeader>
          <CardTitle>Certificate of Internship Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Row label="Student" value={enrollment?.internships ? undefined : undefined} />
          <Row label="Internship" value={enrollment?.internships?.title} />
          <Row label="Starting date" value={enrollment?.start_date} />
          <Row label="Ending date" value={enrollment?.end_date} />
          <Row label="Certificate ID" value={certificate.certificate_number} />
          <Row label="Issue date" value={certificate.issue_date} />

          <div className="flex items-center gap-6 pt-4">
            {qrDataUrl && <img src={qrDataUrl} alt="Verification QR code" className="w-28 h-28 rounded-lg" />}
            <div>
              <p className="text-muted-foreground">Verification link</p>
              <a href={verifyLink} className="text-primary hover:underline break-all">{verifyLink}</a>
            </div>
          </div>

          {pdfUrl && (
            <Button asChild className="neon-btn w-full">
              <a href={pdfUrl} target="_blank" rel="noreferrer" download>
                Download Certificate PDF
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div className="flex justify-between border-b border-glass-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  ) : null;

export default CertificateView;
