import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface VerifyResult {
  certificate_number: string;
  status: string;
  student_name: string;
  internship_title: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  issue_date: string;
}

const VerifyCertificate = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(code ?? "");
  const [result, setResult] = useState<VerifyResult | null | "not_found">(null);
  const [loading, setLoading] = useState(!!code);

  const runVerify = async (c: string) => {
    setLoading(true);
    const { data } = await supabase.rpc("verify_certificate", { p_code: c });
    setResult(data && data[0] ? data[0] : "not_found");
    setLoading(false);
  };

  useEffect(() => {
    if (code) runVerify(code);
  }, [code]);

  return (
    <div className="pt-32 pb-24 max-w-lg mx-auto px-6">
      <h1 className="text-2xl font-bold text-foreground mb-6 text-center">Verify a TechDudes Certificate</h1>

      <div className="flex gap-2 mb-8">
        <Input
          placeholder="Enter certificate ID"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button
          className="neon-btn"
          onClick={() => {
            navigate(`/verify/${input}`);
            runVerify(input);
          }}
        >
          Verify
        </Button>
      </div>

      {loading && <p className="text-muted-foreground text-center">Checking…</p>}

      {result === "not_found" && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-semibold">Certificate Not Found</p>
            <p className="text-muted-foreground text-sm mt-2">
              The certificate ID you entered could not be verified.
            </p>
          </CardContent>
        </Card>
      )}

      {result && result !== "not_found" && result.status === "revoked" && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-semibold">Certificate Revoked</p>
          </CardContent>
        </Card>
      )}

      {result && result !== "not_found" && result.status === "issued" && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="py-8 space-y-3 text-sm">
            <p className="text-primary font-semibold text-center mb-4">Certificate Verified</p>
            <Row label="Certificate ID" value={result.certificate_number} />
            <Row label="Student Name" value={result.student_name} />
            <Row label="Internship" value={result.internship_title} />
            <Row label="Starting Date" value={result.start_date} />
            <Row label="Ending Date" value={result.end_date} />
            <Row label="Duration" value={`${result.duration_days} Days`} />
            <Row label="Issue Date" value={result.issue_date} />
            <Row label="Issued by" value="TechDudes" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground">{value}</span>
  </div>
);

export default VerifyCertificate;
