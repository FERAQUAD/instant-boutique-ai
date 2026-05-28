import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PLATFORM_FEE_NAIRA = 10000;
const PLATFORM_FEE_KOBO = PLATFORM_FEE_NAIRA * 100;

export const initPlatformPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Paystack not configured");

    const email = (claims as { email?: string }).email;
    if (!email) throw new Error("Email required for payment");

    // Reuse existing pending row or create one
    const { data: existing } = await supabaseAdmin
      .from("platform_payments")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "paid")
      .maybeSingle();
    if (existing) return { alreadyPaid: true as const };

    const reference = `sg_${userId.slice(0, 8)}_${Date.now()}`;

    const origin = new URL(getRequest().url).origin;
    const callback_url = `${origin}/activate?ref=${reference}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: PLATFORM_FEE_KOBO,
        currency: "NGN",
        reference,
        callback_url,
        metadata: { user_id: userId, purpose: "storegen_activation" },
      }),
    });
    const body = await res.json();
    if (!res.ok || !body.status) {
      throw new Error(body.message || "Failed to initialize payment");
    }

    await supabaseAdmin.from("platform_payments").insert({
      user_id: userId,
      amount: PLATFORM_FEE_NAIRA,
      currency: "NGN",
      status: "pending",
      paystack_ref: reference,
    });

    return {
      alreadyPaid: false as const,
      authorization_url: body.data.authorization_url as string,
      reference,
    };
  });

export const verifyPlatformPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ reference: z.string().min(4).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Paystack not configured");

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const body = await res.json();
    if (!res.ok || !body.status) throw new Error(body.message || "Verification failed");

    const status = body.data.status as string;
    if (status === "success") {
      await supabaseAdmin
        .from("platform_payments")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("paystack_ref", data.reference)
        .eq("user_id", userId);
      return { paid: true as const };
    }
    return { paid: false as const, status };
  });

export const getMyPaymentStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("platform_payments")
      .select("status, paid_at, paystack_ref")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { paid: data?.status === "paid", row: data };
  });
