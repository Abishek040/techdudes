import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Internship } from "@/types/internship";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const addDays = (date: string, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const Enroll = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("internships").select("*").eq("slug", slug).single().then(({ data }) => {
      setInternship(data as Internship);
    });
  }, [slug]);

  useEffect(() => {
    if (internship && startDate) {
      setEndDate(addDays(startDate, internship.duration_days));
    }
  }, [startDate, internship]);

  if (!internship) return <div className="pt-32 text-center text-muted-foreground">Loading…</div>;

  const handleConfirm = async () => {
  setError(null);

  if (!startDate || !endDate) {
    setError("Please select a starting date.");
    return;
  }

  if (new Date(startDate) < new Date(new Date().toDateString())) {
    setError("Starting date cannot be in the past.");
    return;
  }

  setSubmitting(true);

  // 1. Create the enrollment
  const { data: enrollment, error: insErr } = await supabase
    .from("enrollments")
    .insert({
      student_id: user!.id,
      internship_id: internship.id,
      start_date: startDate,
      end_date: endDate,
      duration_days: internship.duration_days,
      status: "not_started",
    })
    .select("id")
    .single();

  if (insErr) {
    setSubmitting(false);
    setError(insErr.message);
    return;
  }

  // 2. Send enrollment confirmation email
  const { error: emailError } = await supabase.functions.invoke(
    "enrollment-confirmation-email",
    {
      body: {
        enrollment_id: enrollment.id,
      },
    },
  );

  // The enrollment itself was successful.
  // If email fails, don't cancel the enrollment.
  if (emailError) {
    console.error(
      "Enrollment confirmation email failed:",
      emailError,
    );
  }

  setSubmitting(false);

  // 3. Go to dashboard
  navigate("/internship/dashboard");
};

  return (
    <div className="pt-32 pb-24 max-w-lg mx-auto px-6">
      <Card className="border-glass-border bg-glass/40 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">{internship.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-sm">
            Please choose your internship ending date carefully. Your certificate will be generated on your
            selected ending date, even if you complete the course earlier.
          </p>

          {!confirming ? (
            <>
              <div className="space-y-1.5">
                <Label>Starting date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              {startDate && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Ending date: <span className="text-foreground">{endDate}</span></p>
                  <p>Duration: <span className="text-foreground">{internship.duration_days} days</span></p>
                </div>
              )}
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button
                className="w-full neon-btn"
                disabled={!startDate}
                onClick={() => setConfirming(true)}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <div className="bg-glass/30 border border-glass-border rounded-xl p-4 text-sm text-foreground">
                You have selected <strong>{startDate}</strong> as your starting date and{" "}
                <strong>{endDate}</strong> as your ending date. Your certificate will be generated on the
                selected ending date, even if you complete the course earlier. Dates cannot be changed once
                the internship starts.
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>
                  Back
                </Button>
                <Button className="flex-1 neon-btn" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? "Saving…" : "Confirm & Start"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Enroll;
