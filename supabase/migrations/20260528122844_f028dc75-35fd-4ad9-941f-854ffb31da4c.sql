
-- Set search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Revoke public execute on security-definer helpers; they're only called from RLS policies, not the API
REVOKE EXECUTE ON FUNCTION public.is_store_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_order_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Storage: tighten public read to GET semantics (PostgREST/Storage server still serves public bucket URLs).
-- Replace broad SELECT policy with anon-only for direct object fetches and disallow listing.
DROP POLICY IF EXISTS "Public read store-assets" ON storage.objects;
CREATE POLICY "Public read store-assets files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'store-assets' AND coalesce(array_length(storage.foldername(name), 1), 0) >= 1);
