## StoreGen MVP plan

Path-based stores (`/s/:slug`), Paystack for the ₦10,000 platform fee only, no AI Studio yet, no customer checkout payments yet (orders captured as `pending`). Built on the project's TanStack Start + Lovable Cloud (Supabase) stack.

### Scope in this iteration
1. Enable Lovable Cloud.
2. Auth (email/password + Google via Lovable broker).
3. Paystack ₦10k one-time activation fee (init server fn + webhook).
4. 3-step store creation wizard (gated by `payment_status = active`).
5. Admin dashboard: overview, products CRUD with image upload, store settings, store preview link.
6. Public storefront at `/s/:slug` with product grid, product detail, cart drawer, checkout form that creates a `pending` order (no payment yet).
7. Landing page with hero, features, pricing card, FAQ, footer.

### Deferred (follow-up iterations, called out so user knows)
- AI Studio / virtual try-on (Replicate or fal.ai).
- Paystack for customer orders + order status emails (Resend).
- True wildcard subdomains + custom domains.
- Bulk product actions, rich-text descriptions, inventory low-stock alerts, analytics widgets beyond basic counts.

### Routes
```
/                          Landing
/login, /signup, /reset-password
/_authenticated/
  activate                 Paystack ₦10k checkout
  onboarding               3-step wizard (only if paid + no store)
  dashboard                Overview
  dashboard/products       CRUD
  dashboard/orders         List + detail
  dashboard/settings       Branding, contact
/s/$slug                   Public storefront home
/s/$slug/product/$id       Product detail
/s/$slug/checkout          Checkout form (creates pending order)
/api/public/paystack-webhook  Paystack webhook
```

### Database (Supabase migration)
Tables: `stores`, `products`, `orders`, `order_items`, `platform_payments`. Skip `ai_generated_images` until AI iteration.
- All tables: RLS on, GRANT to `authenticated` and `service_role`; `anon` SELECT only on published `products` and active `stores`.
- Owner policies use `auth.uid() = stores.owner_id`.
- `store-assets` Supabase Storage bucket (public) for logos, banners, product images, with owner-only write policies.

### Payment flow (Paystack platform fee)
- `initPaystack` server fn (`requireSupabaseAuth`): creates `platform_payments` row (`pending`), calls Paystack `/transaction/initialize` with amount `1000000` kobo, returns `authorization_url`.
- `/api/public/paystack-webhook` (TSS server route): verifies `x-paystack-signature` HMAC-SHA512 with `PAYSTACK_SECRET_KEY`, on `charge.success` flips `platform_payments.status = paid` and `stores.payment_status = active` (or marks user eligible to create store if no store yet — handled via `platform_payments.user_id`).
- Activation page polls payment status; on success redirects to `/onboarding` (or `/dashboard` if store exists).

### Secrets needed
- `PAYSTACK_SECRET_KEY` (added via secrets tool after user confirms).
- `VITE_PAYSTACK_PUBLIC_KEY` (publishable, can live in code/env).

### Public storefront data
Server fn `getPublicStore({ slug })` using `supabaseAdmin` with explicit safe columns (no owner email/phone unless store opted-in) + filter `is_active = true`. Same pattern for `getPublicProducts`.

### Tech notes
- TanStack Query for all reads (`ensureQueryData` in loaders, `useSuspenseQuery` in components).
- React Hook Form + Zod for all forms.
- shadcn/ui throughout; semantic tokens in `src/styles.css` (no raw colors in components). Will introduce a clean modern palette + Inter/Poppins pair tuned for Nigerian e-commerce (warm orange primary, deep navy ink).
- Cart state: Zustand or React context with localStorage per slug.

### Build order
1. Enable Cloud → migration + storage bucket.
2. Design tokens + landing + auth pages.
3. Activation + Paystack init/webhook (request `PAYSTACK_SECRET_KEY`).
4. Onboarding wizard → dashboard shell.
5. Products CRUD + image upload.
6. Public storefront + cart + pending-order checkout.
7. Settings + orders list.

After approval I'll ask you for `PAYSTACK_SECRET_KEY` and `VITE_PAYSTACK_PUBLIC_KEY` at the point we wire payments.