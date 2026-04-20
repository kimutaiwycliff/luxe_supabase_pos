import {
  ShoppingBag, Monitor, BarChart2, Package, Users, Receipt,
  ClipboardList, Layers, Bell, Zap, Shield, ArrowRight,
  ChevronRight, TrendingUp, RefreshCw, Truck, Settings,
  LayoutDashboard, MapPin, Phone, Mail, CheckCircle2
} from 'lucide-react';
import { Suspense } from 'react';
import Link from 'next/link';
import { AuthButton } from '@/components/auth-button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const modules = [
  {
    icon: <Monitor className="w-7 h-7" />,
    title: "POS Terminal",
    description: "Lightning-fast checkout with barcode scanning, product search, and receipt generation built for high-volume retail.",
    color: "from-amber-500 to-orange-500",
    href: "/pos",
    tag: "Core"
  },
  {
    icon: <Package className="w-7 h-7" />,
    title: "Inventory Control",
    description: "Real-time stock tracking across every SKU. Get low-stock alerts before you run out and never miss a sale.",
    color: "from-orange-500 to-red-500",
    href: "/inventory",
    tag: "Essential"
  },
  {
    icon: <BarChart2 className="w-7 h-7" />,
    title: "Analytics & Reports",
    description: "Daily sales summaries, revenue trends, top-selling products, and automated email reports delivered at midnight.",
    color: "from-yellow-500 to-amber-500",
    href: "/analytics",
    tag: "Insights"
  },
  {
    icon: <Users className="w-7 h-7" />,
    title: "Customer CRM",
    description: "Track customer purchase history, manage loyalty, and build relationships that bring buyers back.",
    color: "from-amber-600 to-yellow-500",
    href: "/customers",
    tag: "CRM"
  },
  {
    icon: <Layers className="w-7 h-7" />,
    title: "Layaway Management",
    description: "Accept deposits and manage instalment plans. Customers save towards products while you secure the sale.",
    color: "from-orange-600 to-amber-500",
    href: "/layaways",
    tag: "Finance"
  },
  {
    icon: <ClipboardList className="w-7 h-7" />,
    title: "Purchase Orders",
    description: "Create, track, and receive supplier orders. Close the loop between purchasing and inventory automatically.",
    color: "from-red-500 to-orange-500",
    href: "/purchase-orders",
    tag: "Procurement"
  },
  {
    icon: <Bell className="w-7 h-7" />,
    title: "Low Stock Alerts",
    description: "Configurable reorder thresholds with instant alerts. Smart reorder suggestions based on your sales velocity.",
    color: "from-yellow-600 to-orange-500",
    href: "/low-stock",
    tag: "Alerts"
  },
  {
    icon: <Truck className="w-7 h-7" />,
    title: "Supplier Management",
    description: "Centralise all supplier contacts, pricing, and lead times in one place linked directly to your products.",
    color: "from-amber-500 to-yellow-600",
    href: "/suppliers",
    tag: "Operations"
  }
];

const stats = [
  { value: "8+", label: "Integrated Modules" },
  { value: "Real-time", label: "Inventory Sync" },
  { value: "M-Pesa", label: "Payment Ready" },
  { value: "Daily", label: "Automated Reports" },
];

const workflow = [
  {
    step: "01",
    title: "Log In & Open Your Shift",
    description: "Staff access the POS dashboard securely. Role-based permissions ensure cashiers see only what they need.",
    icon: <Shield className="w-6 h-6" />
  },
  {
    step: "02",
    title: "Process Sales at Speed",
    description: "Search or scan products, apply discounts, accept M-Pesa or card payments, and print receipts in seconds.",
    icon: <Zap className="w-6 h-6" />
  },
  {
    step: "03",
    title: "Track Everything Automatically",
    description: "Every sale updates inventory, customer records, and analytics in real time. Reports land in your inbox overnight.",
    icon: <TrendingUp className="w-6 h-6" />
  }
];

const highlights = [
  "Barcode & product search checkout",
  "Automated midnight sales reports via email",
  "Layaway & deposit management",
  "Supplier & purchase order tracking",
  "Low-stock alerts with reorder suggestions",
  "Customer purchase history & CRM",
  "Role-based staff access control",
  "Dark mode & mobile responsive",
];

export default function LuxePOSLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav className="fixed w-full z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-light tracking-wider">
                LUXE <span className="font-bold">POS</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <a href="#modules" className="text-sm text-muted-foreground tracking-wide transition-colors hover:text-foreground">Modules</a>
              <a href="#workflow" className="text-sm text-muted-foreground tracking-wide transition-colors hover:text-foreground">How It Works</a>
              <a href="#features" className="text-sm text-muted-foreground tracking-wide transition-colors hover:text-foreground">Features</a>
              <Suspense fallback={<div className="w-20 h-9 rounded-full bg-muted animate-pulse" />}>
                <AuthButton />
              </Suspense>
            </div>

            <div className="lg:hidden">
              <Suspense fallback={null}>
                <AuthButton />
              </Suspense>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950 via-amber-900 to-yellow-900" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(251,191,36,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251,191,36,0.4) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px'
          }}
        />

        {/* Radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/20 blur-[120px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Badge
            variant="secondary"
            className="mb-6 text-xs sm:text-sm bg-amber-500/20 text-amber-300 border-amber-500/30 backdrop-blur"
          >
            <MapPin className="w-3 h-3 mr-1" />
            Built for Luxe Collections Kenya 🇰🇪
          </Badge>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-light text-white mb-6 tracking-tight leading-[1.05]">
            The Smart POS for{' '}
            <span className="font-extrabold bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Modern Retail
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-amber-100/80 mb-10 font-light max-w-3xl mx-auto leading-relaxed">
            Fast checkout, real-time inventory, customer management, layaway, analytics, and daily reports —
            all in one system built for your store.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="rounded-full px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-0 shadow-2xl shadow-amber-500/30 hover:scale-105 transition-all group w-full sm:w-auto"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Open Dashboard
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#modules">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20 w-full sm:w-auto"
              >
                Explore Modules
              </Button>
            </a>
          </div>

          {/* Floating stat pills */}
          <div className="mt-14 flex flex-wrap justify-center gap-3">
            {stats.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-white"
              >
                <span className="font-bold text-amber-300">{s.value}</span>
                <span className="text-xs text-white/70">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── Modules Grid ───────────────────────────────────────────── */}
      <section id="modules" className="py-20 lg:py-28 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-xs">
              <Settings className="w-3 h-3 mr-1" />
              All-in-One Platform
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-light mb-4">
              Every Module Your{' '}
              <span className="font-bold">Store Needs</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Eight integrated modules that cover every corner of retail operations — all talking to the same data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((mod, i) => (
              <Link href={`/dashboard`} key={i}>
                <div
                  className="group relative rounded-2xl border bg-card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden h-full"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Subtle gradient top accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mod.color} rounded-t-2xl`} />

                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${mod.color} text-white mb-4 shadow-lg`}>
                    {mod.icon}
                  </div>

                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-base">{mod.title}</h3>
                    <Badge variant="secondary" className="text-xs ml-2 shrink-0">{mod.tag}</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>

                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open module <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ───────────────────────────────────────────────── */}
      <section
        id="workflow"
        className="py-20 lg:py-28 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 scroll-mt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Daily Workflow
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-light mb-4">
              How It <span className="font-bold">Works</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From opening the shift to overnight reports — the whole day in three steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-amber-300 to-orange-300 dark:from-amber-600 dark:to-orange-600" />

            {workflow.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="relative inline-flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 mb-6">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 rounded-full w-6 h-6 flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Highlights ─────────────────────────────────────── */}
      <section id="features" className="py-20 lg:py-28 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <div>
              <Badge variant="outline" className="mb-4 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Built-in Features
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-light mb-6">
                Everything Built{' '}
                <span className="font-bold">Right In</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                No add-ons, no extra subscriptions. Every feature Luxe Collections needs to run day-to-day is
                already here and talking to the same live data.
              </p>

              <ul className="space-y-3">
                {highlights.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="rounded-full px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-0 shadow-xl shadow-amber-500/20 hover:scale-105 transition-all group"
                  >
                    Access the Dashboard
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: visual mosaic */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Receipt className="w-8 h-8" />, label: "Fast Checkout", color: "from-amber-500 to-orange-500", stat: "< 30s" },
                { icon: <Package className="w-8 h-8" />, label: "Live Inventory", color: "from-orange-500 to-red-500", stat: "Real-time" },
                { icon: <BarChart2 className="w-8 h-8" />, label: "Daily Reports", color: "from-yellow-500 to-amber-500", stat: "Automated" },
                { icon: <Layers className="w-8 h-8" />, label: "Layaway Plans", color: "from-amber-600 to-yellow-500", stat: "Flexible" },
              ].map((card, i) => (
                <div
                  key={i}
                  className={`rounded-2xl bg-gradient-to-br ${card.color} p-6 text-white shadow-xl flex flex-col gap-2 ${i === 0 ? 'mt-6' : ''} ${i === 2 ? 'mt-6' : ''}`}
                >
                  {card.icon}
                  <p className="font-semibold text-sm mt-2">{card.label}</p>
                  <p className="text-2xl font-black">{card.stat}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-amber-800 to-yellow-900" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(251,191,36,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251,191,36,0.4) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px'
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/20 blur-[100px]" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-light text-white mb-6">
            Ready to Run{' '}
            <span className="font-extrabold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
              Your Store Smarter?
            </span>
          </h2>
          <p className="text-amber-100/80 text-lg mb-10">
            Sign in to access your full dashboard — POS, inventory, analytics, customers, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="rounded-full px-10 bg-white text-orange-900 hover:bg-amber-50 font-semibold hover:scale-105 transition-all shadow-2xl w-full sm:w-auto"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/pos">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-10 bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20 w-full sm:w-auto"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Open POS Terminal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t bg-secondary/20 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-light tracking-wider">
                  LUXE <span className="font-bold">POS</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                The complete point-of-sale system for Luxe Collections Kenya — inventory, sales, customers, and analytics in one place.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">Modules</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/pos" className="text-muted-foreground hover:text-foreground transition-colors">POS Terminal</Link></li>
                <li><Link href="/inventory" className="text-muted-foreground hover:text-foreground transition-colors">Inventory</Link></li>
                <li><Link href="/analytics" className="text-muted-foreground hover:text-foreground transition-colors">Analytics</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">Operations</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/customers" className="text-muted-foreground hover:text-foreground transition-colors">Customers</Link></li>
                <li><Link href="/layaways" className="text-muted-foreground hover:text-foreground transition-colors">Layaways</Link></li>
                <li><Link href="/purchase-orders" className="text-muted-foreground hover:text-foreground transition-colors">Purchase Orders</Link></li>
                <li><Link href="/suppliers" className="text-muted-foreground hover:text-foreground transition-colors">Suppliers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>Nairobi, Kenya</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>+254 XXX XXX XXX</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>info@luxecollections.ke</span>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © 2025 Luxe Collections Kenya. Internal POS System. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
