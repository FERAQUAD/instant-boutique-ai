
-- Enums
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'active');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.platform_payment_status AS ENUM ('pending', 'paid', 'failed');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- STORES
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  store_slug text NOT NULL UNIQUE,
  subdomain text UNIQUE,
  custom_domain text UNIQUE,
  theme_settings jsonb NOT NULL DEFAULT '{"primary":"#ea580c","secondary":"#0f172a","font":"Inter","showSearch":true,"showCategoryFilter":true}'::jsonb,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  store_logo text,
  hero_banner text,
  contact_email text,
  contact_phone text,
  whatsapp_number text,
  instagram_url text,
  facebook_url text,
  twitter_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stores_owner_idx ON public.stores(owner_id);
CREATE INDEX stores_slug_idx ON public.stores(store_slug);
CREATE TRIGGER stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT SELECT ON public.stores TO anon;
GRANT ALL ON public.stores TO service_role;

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their store" ON public.stores
  FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Public can view active stores" ON public.stores
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  compare_at_price numeric(12,2),
  sku text,
  inventory_count integer NOT NULL DEFAULT 0,
  images text[] NOT NULL DEFAULT '{}',
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_store_idx ON public.products(store_id);
CREATE INDEX products_published_idx ON public.products(store_id, is_published);
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Security definer helper to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_store_owner(_store_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = _user_id);
$$;

CREATE POLICY "Owners manage their products" ON public.products
  FOR ALL TO authenticated
  USING (public.is_store_owner(store_id, auth.uid()))
  WITH CHECK (public.is_store_owner(store_id, auth.uid()));

CREATE POLICY "Public can view published products" ON public.products
  FOR SELECT TO anon, authenticated USING (is_published = true);

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_ref text,
  shipping_address jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_store_idx ON public.orders(store_id, created_at DESC);
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view their orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_store_owner(store_id, auth.uid()));
CREATE POLICY "Owners update their orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_store_owner(store_id, auth.uid()))
  WITH CHECK (public.is_store_owner(store_id, auth.uid()));
CREATE POLICY "Owners delete their orders" ON public.orders
  FOR DELETE TO authenticated USING (public.is_store_owner(store_id, auth.uid()));
CREATE POLICY "Anyone can place orders on active stores" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.is_active = true));

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO anon;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_order_owner(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.stores s ON s.id = o.store_id
    WHERE o.id = _order_id AND s.owner_id = _user_id
  );
$$;

CREATE POLICY "Owners view their order items" ON public.order_items
  FOR SELECT TO authenticated USING (public.is_order_owner(order_id, auth.uid()));
CREATE POLICY "Anyone can create order items on active store orders" ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o JOIN public.stores s ON s.id = o.store_id
    WHERE o.id = order_id AND s.is_active = true
  ));

-- PLATFORM PAYMENTS
CREATE TABLE public.platform_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL DEFAULT 10000,
  currency text NOT NULL DEFAULT 'NGN',
  status public.platform_payment_status NOT NULL DEFAULT 'pending',
  paystack_ref text UNIQUE,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX platform_payments_user_idx ON public.platform_payments(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.platform_payments TO authenticated;
GRANT ALL ON public.platform_payments TO service_role;

ALTER TABLE public.platform_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their payments" ON public.platform_payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert their payments" ON public.platform_payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read store-assets" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'store-assets');
CREATE POLICY "Authenticated upload to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update own files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'store-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'store-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
