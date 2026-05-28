import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { initPlatformPayment, verifyPlatformPayment, getMyPaymentStatus } from "@/lib/paystack.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatNaira } from "@/lib/format";
import { Store, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/activate")({
  validateSearch: z.object({ ref: z.string().optional() }),
  head: () => ({ meta: [{ title: "Activate your store — StoreGen" }] }),
  component: Activate,
});

function Activate() {
  const navigate = useNavigate();
  const { ref } = useSearch({ from: "/_authenticated/activate" });
  const init = useServerFn(initPlatformPayment);
  const verify = useServerFn(verifyPlatformPayment);
  const status = useServerFn(getMyPaymentStatus);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    status({}).then((r) => {
      if (r.paid) { setPaid(true); navigate({ to: "/dashboard" }); }
    });
  }, []);

  useEffect(() => {
    if (!ref) return;
    verify({ data: { reference: ref } }).then((r) => {
      if (r.paid) { toast.success("Payment confirmed!"); setPaid(true); navigate({ to: "/dashboard" }); }
      else toast.error("Payment not completed yet.");
    }).catch((e) => toast.error(e.message));
  }, [ref]);

  async function pay() {
    setLoading(true);
    try {
      const r = await init({});
      if (r.alreadyPaid) { setPaid(true); navigate({ to: "/dashboard" }); return; }
      window.location.href = r.authorization_url;
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Store className="h-5 w-5" /></div>
          <span className="font-display text-lg font-bold">StoreGen</span>
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold">One step to launch</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pay the one-time setup fee to activate your store.</p>
        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span>StoreGen Store Setup</span>
            <span className="font-semibold">{formatNaira(10000)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-display text-xl font-bold">{formatNaira(10000)}</span>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
          {["One-time payment, no monthly fees","Unlimited products","Lifetime hosting & SSL"].map((t) => (
            <li key={t} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" />{t}</li>
          ))}
        </ul>
        <Button onClick={pay} disabled={loading || paid} className="mt-6 h-12 w-full text-base">
          {paid ? "Activated ✓" : loading ? "Redirecting to Paystack…" : `Pay ${formatNaira(10000)} with Paystack`}
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">Secured by Paystack</p>
      </Card>
    </div>
  );
}
