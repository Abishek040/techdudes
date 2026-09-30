// supabase/functions/razorpay-create-order/index.ts
// Creates a Razorpay order for a student's certificate fee.
// The Razorpay key secret NEVER leaves this function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    // Use the caller's JWT so RLS applies — a student can only see their own enrollment.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { enrollment_id } = await req.json();
    if (!enrollment_id) {
      return json({ error: "enrollment_id is required" }, 400);
    }

    const { data: enrollment, error: enrErr } = await supabase
      .from("enrollments")
      .select("id, modules_completed, quiz_passed, payment_verified, internship_id, internships(certificate_fee_paise)")
      .eq("id", enrollment_id)
      .single();

    if (enrErr || !enrollment) {
      return json({ error: "Enrollment not found or not yours" }, 404);
    }
    if (!enrollment.modules_completed || !enrollment.quiz_passed) {
      return json({ error: "Complete all modules and pass the quiz before paying" }, 400);
    }
    if (enrollment.payment_verified) {
      return json({ error: "Payment already verified for this enrollment" }, 400);
    }

    const amount = (enrollment as any).internships.certificate_fee_paise;

    // Razorpay Orders API — https://api.razorpay.com/v1/orders
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `enr_${enrollment_id.slice(0, 20)}`,
        notes: { enrollment_id },
      }),
    });

    if (!rpRes.ok) {
      const errText = await rpRes.text();
      return json({ error: "Razorpay order creation failed", detail: errText }, 502);
    }

    const order = await rpRes.json();

    // Record the order using the service role (bypasses RLS — students can't write payments directly)
    const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: insErr } = await admin.from("payments").insert({
      enrollment_id,
      razorpay_order_id: order.id,
      amount_paise: amount,
      status: "created",
    });
    if (insErr) {
      return json({ error: "Failed to record order", detail: insErr.message }, 500);
    }

    return json({
      order_id: order.id,
      amount,
      currency: "INR",
      key_id: RAZORPAY_KEY_ID, // publishable, safe for the frontend checkout widget
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
