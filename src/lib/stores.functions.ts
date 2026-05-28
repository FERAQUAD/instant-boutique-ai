import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const slugRegex = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;

export const checkSlugAvailable = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    if (!slugRegex.test(data.slug)) return { available: false, reason: "Invalid format" };
    const { data: row } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("store_slug", data.slug)
      .maybeSingle();
    return { available: !row };
  });

const createStoreSchema = z.object({
  store_name: z.string().min(2).max(60),
  store_slug: z.string().regex(slugRegex),
  store_logo: z.string().url().nullable().optional(),
  hero_banner: z.string().url().nullable().optional(),
  theme_settings: z.object({
    primary: z.string(),
    secondary: z.string(),
    font: z.string(),
    showSearch: z.boolean(),
    showCategoryFilter: z.boolean(),
  }),
  contact_email: z.string().email().nullable().optional(),
  contact_phone: z.string().max(40).nullable().optional(),
  whatsapp_number: z.string().max(40).nullable().optional(),
  instagram_url: z.string().url().nullable().optional().or(z.literal("")),
  facebook_url: z.string().url().nullable().optional().or(z.literal("")),
  twitter_url: z.string().url().nullable().optional().or(z.literal("")),
});

export const createStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createStoreSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Must have an active platform payment
    const { data: payment } = await supabaseAdmin
      .from("platform_payments")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "paid")
      .limit(1)
      .maybeSingle();
    if (!payment) throw new Error("Activation payment required");

    // One store per user (MVP)
    const { data: existing } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (existing) throw new Error("You already have a store");

    const { data: slugTaken } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("store_slug", data.store_slug)
      .maybeSingle();
    if (slugTaken) throw new Error("Slug already taken");

    const { data: store, error } = await supabaseAdmin
      .from("stores")
      .insert({
        owner_id: userId,
        store_name: data.store_name,
        store_slug: data.store_slug,
        store_logo: data.store_logo ?? null,
        hero_banner: data.hero_banner ?? null,
        theme_settings: data.theme_settings,
        contact_email: data.contact_email ?? null,
        contact_phone: data.contact_phone ?? null,
        whatsapp_number: data.whatsapp_number ?? null,
        instagram_url: data.instagram_url || null,
        facebook_url: data.facebook_url || null,
        twitter_url: data.twitter_url || null,
        payment_status: "active",
        is_active: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return store;
  });

export const getMyStore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const updateStoreSchema = createStoreSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const updateMyStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updateStoreSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("stores")
      .update(data)
      .eq("owner_id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!store) return { products: 0, orders: 0, revenue: 0, pending: 0 };
    const [{ count: productCount }, { count: orderCount }, { data: revenueRows }, { count: pendingCount }] =
      await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("store_id", store.id),
        supabase.from("orders").select("total_amount").eq("store_id", store.id).in("status", ["paid", "processing", "shipped", "delivered"]),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("store_id", store.id).eq("status", "pending"),
      ]);
    const revenue = (revenueRows ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
    return {
      products: productCount ?? 0,
      orders: orderCount ?? 0,
      revenue,
      pending: pendingCount ?? 0,
    };
  });

// PUBLIC reads (used in public storefront, no auth required)
export const getPublicStore = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select(
        "id, store_name, store_slug, store_logo, hero_banner, theme_settings, contact_email, contact_phone, whatsapp_number, instagram_url, facebook_url, twitter_url, is_active",
      )
      .eq("store_slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    return store;
  });

export const getPublicProducts = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("store_slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!store) return [];
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, name, description, price, compare_at_price, images, category, inventory_count")
      .eq("store_id", store.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    return products ?? [];
  });

export const getPublicProduct = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string(), productId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("id, store_name, store_slug, theme_settings")
      .eq("store_slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!store) return null;
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", data.productId)
      .eq("store_id", store.id)
      .eq("is_published", true)
      .maybeSingle();
    return product;
  });
