GRANT EXECUTE ON FUNCTION public.is_store_owner(uuid, uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_order_owner(uuid, uuid) TO authenticated, anon, service_role;