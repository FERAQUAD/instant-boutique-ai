import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { listMyOrders, updateOrderStatus } from "@/lib/orders.functions";
import { getMyStore } from "@/lib/stores.functions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "Orders — StoreGen" }] }),
  component: OrdersPage,
});

const statuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;

function OrdersPage() {
  const qc = useQueryClient();
  const getStore = useServerFn(getMyStore);
  const list = useServerFn(listMyOrders);
  const update = useServerFn(updateOrderStatus);

  const storeQ = useQuery({ queryKey: ["my-store"], queryFn: () => getStore({}) });
  const ordersQ = useQuery({ queryKey: ["my-orders"], queryFn: () => list({}), enabled: !!storeQ.data });

  async function setStatus(id: string, status: (typeof statuses)[number]) {
    try {
      await update({ data: { id, status } });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["dash-stats"] });
      toast.success("Status updated");
    } catch (e) { toast.error((e as Error).message); }
  }

  const orders = (ordersQ.data ?? []) as any[];

  return (
    <DashboardShell storeSlug={storeQ.data?.store_slug} storeName={storeQ.data?.store_name}>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Orders</h2>
          <p className="text-sm text-muted-foreground">{orders.length} total</p>
        </div>

        {ordersQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : orders.length === 0 ? (
          <Card className="flex flex-col items-center p-12 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-bold">No orders yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Orders will appear here when customers buy.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Card key={o.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{o.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{o.customer_email} · {o.customer_phone || "—"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold">{formatNaira(Number(o.total_amount))}</p>
                    <Badge variant="outline" className="mt-1">{o.status}</Badge>
                  </div>
                </div>

                <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                  {o.order_items?.map((it: any) => (
                    <div key={it.id} className="flex justify-between">
                      <span>{it.quantity}× {it.product_name}</span>
                      <span>{formatNaira(Number(it.unit_price) * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                {o.shipping_address && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Ship to: {o.shipping_address.line1}, {o.shipping_address.city}, {o.shipping_address.state}
                  </p>
                )}

                <div className="mt-4">
                  <Select value={o.status} onValueChange={(v) => setStatus(o.id, v as any)}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
