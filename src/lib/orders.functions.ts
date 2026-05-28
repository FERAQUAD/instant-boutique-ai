import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const itemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

const createOrderSchema = z.object({
  store_slug: z.string(),
  customer_name: z.string().min(1).max(120),
  customer_email: z.string().email(),
  customer_phone: z.string().max(40).optional(),
  shipping_address: z.object({
    line1: z.string().min(1).max(200),
    city: z.string().min(1).max(80),
    state: z.string().min(1).max(80),
    country: z.string().min(1).max(80).default("Nigeria"),
  }),
  notes: z.string().max(500).optional(),
  items: z.array(itemSchema).min(1).max(50),
});

// Public guest checkout. Uses admin client to write across stores + recompute prices server-side.
export const createGuestOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => createOrderSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id, is_active")
      .eq("store_slug", data.store_slug)
      .maybeSingle();
    if (!store || !store.is_active) throw new Error("Store not found");

    const productIds = data.items.map((i) => i.product_id);
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price, is_published, store_id")
      .in("id", productIds);
    if (prodErr) throw new Error(prodErr.message);

    let total = 0;
    const itemRows: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
    }> = [];
    for (const item of data.items) {
      const p = products?.find((x) => x.id === item.product_id);
      if (!p || p.store_id !== store.id || !p.is_published) {
        throw new Error("Invalid item in cart");
      }
      const unit = Number(p.price);
      total += unit * item.quantity;
      itemRows.push({
        product_id: p.id,
        product_name: p.name,
        quantity: item.quantity,
        unit_price: unit,
      });
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        store_id: store.id,
        customer_email: data.customer_email,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        total_amount: total,
        status: "pending",
        shipping_address: data.shipping_address,
        notes: data.notes,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(itemRows.map((r) => ({ ...r, order_id: order.id })));
    if (itemsErr) throw new Error(itemsErr.message);

    return { orderId: order.id, total };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!store) return [];
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
