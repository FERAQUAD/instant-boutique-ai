import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, Store, ShoppingBag, CreditCard, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StoreGen — Your online store, ready in minutes" },
      { name: "description", content: "Launch a beautiful Jumia/Konga-style storefront for ₦10,000 one-time. No monthly fees. Built for Nigerian small businesses." },
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
      <Pricing />
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
          <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
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
            Sell products on a beautiful Jumia/Konga-style storefront. Pay once, own your store forever.
            No monthly fees. No coding.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to="/signup">Get your store now <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              See pricing →
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-success" /> Hosted & secure</span>
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-success" /> Paystack ready</span>
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
    { icon: CreditCard, title: "Built-in payments", desc: "Take orders with shipping details. Paystack-powered customer checkout coming next." },
    { icon: Zap, title: "Launch in minutes", desc: "Pick a name, upload your logo, add products — your store is live the same day." },
    { icon: ShoppingBag, title: "Manage everything", desc: "Products, orders, branding, contact info — all from one simple dashboard." },
    { icon: Shield, title: "Yours forever", desc: "One-time payment. No monthly fees, no surprise charges, no commission on sales." },
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

function Pricing() {
  return (
    <section id="pricing" className="border-t border-border">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="font-display text-3xl font-bold md:text-4xl">One price. One store. Forever.</h2>
        <p className="mt-3 text-muted-foreground">No monthly fees. No transaction commissions.</p>

        <Card className="mt-10 overflow-hidden border-2 border-primary/40 p-0 text-left shadow-xl">
          <div className="bg-secondary px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
            Limited launch price
          </div>
          <div className="p-8 md:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl font-extrabold md:text-6xl">{formatNaira(10000)}</span>
                <span className="text-xl text-muted-foreground line-through">{formatNaira(25000)}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-primary">One-time payment · Save 60%</p>
            </div>
            <ul className="mx-auto mt-8 grid max-w-md gap-3 text-sm">
              {[
                "Your own storefront at storegen.app/s/your-name",
                "Unlimited products & categories",
                "Custom branding (logo, colors, fonts)",
                "Order management dashboard",
                "Customer checkout with shipping details",
                "Free hosting & SSL",
                "Lifetime access",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8 h-12 w-full text-base">
              <Link to="/signup">Get your store now <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "Is it really a one-time fee?", a: "Yes. Pay ₦10,000 once and your store is yours. No monthly bills, no commissions on sales." },
    { q: "What payment methods can my customers use?", a: "Customer checkout collects orders with shipping details. Paystack customer payments are launching shortly." },
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
