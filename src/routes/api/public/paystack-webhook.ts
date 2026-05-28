import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) return new Response("Not configured", { status: 500 });

        const signature = request.headers.get("x-paystack-signature");
        const body = await request.text();
        const expected = createHmac("sha512", secret).update(body).digest("hex");
        if (
          !signature ||
          signature.length !== expected.length ||
          !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
        ) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: { event?: string; data?: { reference?: string; status?: string; metadata?: { user_id?: string } } };
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        if (payload.event === "charge.success" && payload.data?.reference) {
          const ref = payload.data.reference;
          const userId = payload.data.metadata?.user_id;
          const updates = supabaseAdmin
            .from("platform_payments")
            .update({ status: "paid", paid_at: new Date().toISOString() })
            .eq("paystack_ref", ref);
          const { error } = userId ? await updates.eq("user_id", userId) : await updates;
          if (error) console.error("Webhook update error:", error.message);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
