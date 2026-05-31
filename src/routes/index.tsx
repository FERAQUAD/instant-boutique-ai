import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, Store, ShoppingBag, Zap, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StoreGen — Your online store, ready in minutes" },
      { name: "description", content: "Launch a beautiful Jumia/Konga-style storefront for free. No coding required. Built for Nigerian small businesses." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <FAQ />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">StoreGen</span>
        </Link>
        <nav className="hidden gap-6 text-sm font-medium md:flex">
          <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/login">Log in</Link></Button>
          <Button asChild size="sm"><Link to="/signup">Get started</Link></Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--color-accent)_0%,_transparent_55%)]" />
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Built for Nigerian small businesses
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Your online store, <span className="text-primary">ready in minutes.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Sell products on a beautiful Jumia/Konga-style storefront. Set up in minutes — no coding, no monthly fees.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to="/signup">Create your store <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              See features →
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-success" /> Free to start</span>
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-success" /> Hosted & secure</span>
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-success" /> Unlimited products</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Store, title: "Jumia-style storefront", desc: "Professional product grid, search, categories, and a polished checkout — all out of the box." },
    { icon: ShoppingBag, title: "Order management", desc: "Take orders with shipping details. Track and update fulfillment from one simple dashboard." },
    { icon: Palette, title: "Custom branding", desc: "Upload your logo and hero banner, pick your brand colors, and make the store feel like yours." },
    { icon: Zap, title: "Launch in minutes", desc: "Pick a name, upload your logo, add products — your store is live the same day." },
    { icon: Shield, title: "Hosted & secure", desc: "Free hosting, SSL, and a clean URL at storegen.app/s/your-name. No setup, no servers." },
    { icon: Sparkles, title: "Coming soon: AI Studio", desc: "Virtual try-on and lifestyle product photos generated for you with one click." },
  ];
  return (
    <section id="features" className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Everything you need to sell online</h2>
          <p className="mt-3 text-muted-foreground">From storefront to checkout in one tidy package.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "How much does it cost?", a: "Nothing right now — StoreGen is free to use while we're in early access." },
    { q: "How do customers pay?", a: "Customers place orders with delivery details and you arrange payment directly with them (bank transfer, on delivery, etc.). Online checkout is on the roadmap." },
    { q: "Can I use my own domain?", a: "Custom domains are on the roadmap. For now your store lives at storegen.app/s/your-name." },
    { q: "Do you take a commission on my sales?", a: "Never. 100% of your sales go to you." },
  ];
  return (
    <section id="faq" className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-center font-display text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
        <div className="mt-10 space-y-4">
          {faqs.map(({ q, a }) => (
            <Card key={q} className="p-6">
              <h3 className="font-semibold">{q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Store className="h-4 w-4" />
          </div>
          <span className="font-display font-semibold">StoreGen</span>
        </div>
        <p className="text-xs text-secondary-foreground/70">© {new Date().getFullYear()} StoreGen. Made in Nigeria.</p>
      </div>
    </footer>
  );
}
