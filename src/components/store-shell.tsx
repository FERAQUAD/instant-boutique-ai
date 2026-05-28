import { Link } from "@tanstack/react-router";
import { ShoppingCart, Store } from "lucide-react";
import { useCart, cartCount } from "@/lib/cart";

export function StoreShell({
  store,
  children,
}: {
  store: { store_name: string; store_slug: string; store_logo: string | null; theme_settings: any };
  children: React.ReactNode;
}) {
  const items = useCart((s) => s.itemsBySlug[store.store_slug] ?? []);
  const count = cartCount(items);
  const primary = store.theme_settings?.primary ?? "#ea580c";

  return (
    <div className="min-h-screen bg-background" style={{ ["--storefront-primary" as any]: primary }}>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/s/$slug" params={{ slug: store.store_slug }} className="flex items-center gap-2">
            {store.store_logo ? (
              <img src={store.store_logo} alt={store.store_name} className="h-9 w-9 rounded-md object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md text-white" style={{ background: primary }}>
                <Store className="h-5 w-5" />
              </div>
            )}
            <span className="font-display text-lg font-bold">{store.store_name}</span>
          </Link>
          <Link
            to="/s/$slug/checkout"
            params={{ slug: store.store_slug }}
            className="relative flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <ShoppingCart className="h-4 w-4" /> Cart
            {count > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: primary }}
              >{count}</span>
            )}
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {store.store_name} · Powered by{" "}
          <a href="/" className="font-semibold text-foreground hover:underline">StoreGen</a>
        </div>
      </footer>
    </div>
  );
}
