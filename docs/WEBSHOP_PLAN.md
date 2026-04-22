# Luxe Collections Webshop — Implementation Plan

> **Separate repo, same Supabase backend.**
> Public-facing storefront that shares the POS Supabase project. Each phase must
> pass all its tests before the next phase starts.

---

## Architecture

```
Supabase Project (shared)
├── POS App  → github: luxe_supabase_pos   → vercel: pos.luxecollections.co.ke
└── Webshop  → github: luxe_webshop (new)  → vercel: shop.luxecollections.co.ke
```

---

## Authentication Decision: Supabase Auth (not Better Auth + Neon)

Supabase Auth already supports Magic Links (Email OTP). Using it keeps customer
identity co-located with their orders — both live in the same Postgres database.
Better Auth + Neon would split identity (Neon) from order/product data (Supabase),
requiring a cross-database lookup on every authenticated request.

**Magic Link setup** — no library change needed. In Supabase Dashboard →
Authentication → Email Templates → enable "Magic Link". Set the redirect URL to
`https://shop.luxecollections.co.ke/auth/callback`.

POS staff (`role = 'admin'|'staff'`) and webshop customers (`role = 'customer'`)
share the same `auth.users` table, differentiated by `user_profiles.role`. The
webshop proxy/middleware gates only `/account/*` — the storefront is fully public.

> **Next.js 16 note:** The webshop uses `proxy.ts` (not `middleware.ts`) with an
> exported `proxy` function — identical to the pattern in the POS. This is the
> Next.js 16 Fluid compute middleware pattern.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, proxy.ts middleware) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui (separate design tokens from POS) |
| Theme | `next-themes` — system-aware dark/light toggle, `class` strategy |
| Design skills | `frontend-design` + `ui-ux-pro-max` applied to every UI phase |
| Package manager | pnpm |
| Auth | Supabase Auth — Magic Link (Email OTP) |
| Cart state | Zustand + localStorage |
| Server state | TanStack Query |
| Payments (primary) | Safaricom Daraja M-Pesa STK Push |
| Payments (fallback) | Flutterwave (covers M-Pesa too if Daraja approval is delayed) |
| Email | Resend (same account, new `orders@` sender) |
| Search | Algolia (same indexes, search-only key) |
| Rate limiting | Upstash Redis |
| Deployment | Vercel (separate project from POS) |

---

## Design System

> Generated with `ui-ux-pro-max` skill (`frontend-design` + `ui-ux-pro-max`).
> Every UI phase must follow these tokens — no ad-hoc hex values in components.

### Aesthetic Direction

**Style:** Liquid Glass — flowing translucent surfaces, morphing elements, fluid 400–600 ms curves, dynamic `backdrop-filter` blur. Premium, editorial, unforgettable.

**Differentiation:** The one thing visitors remember — layered glass cards floating over rich dark/warm-stone backgrounds with a persistent gold accent thread running from the navbar badge to the checkout CTA.

---

### Typography

| Role | Font | Weights |
|---|---|---|
| Display / Heading | **Cormorant** (serif) | 400 500 600 700 |
| Body / UI | **Montserrat** (sans-serif) | 300 400 500 600 700 |

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');
```

```ts
// tailwind.config.ts
fontFamily: {
  serif: ['Cormorant', 'serif'],
  sans:  ['Montserrat', 'sans-serif'],
}
```

**Rules:**
- Page titles, product names, section headings → `font-serif`
- All body copy, labels, buttons, nav → `font-sans`
- Minimum body size: 16 px (avoids iOS auto-zoom)
- Line-height: 1.5–1.75 for body; tight (1.1–1.2) for display headings

---

### Color Tokens — Light Mode

| Token (CSS var) | Hex | Usage |
|---|---|---|
| `--background` | `#FAFAF9` | Page background (warm off-white) |
| `--foreground` | `#0C0A09` | Primary text |
| `--card` | `#FFFFFF` | Card surfaces |
| `--card-foreground` | `#0C0A09` | Text on cards |
| `--primary` | `#1C1917` | Primary actions, navbar |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--secondary` | `#44403C` | Secondary buttons, icons |
| `--secondary-foreground` | `#FFFFFF` | Text on secondary |
| `--accent` | `#A16207` | Gold — badges, prices, CTAs, highlights |
| `--accent-foreground` | `#FFFFFF` | Text on accent |
| `--muted` | `#E8ECF0` | Skeleton loaders, dividers |
| `--muted-foreground` | `#64748B` | Placeholder text, captions |
| `--border` | `#D6D3D1` | Card borders, input outlines |
| `--destructive` | `#DC2626` | Error states, delete actions |
| `--ring` | `#1C1917` | Focus rings |

### Color Tokens — Dark Mode

| Token (CSS var) | Hex | Usage |
|---|---|---|
| `--background` | `#0C0A09` | Page background (near-black warm) |
| `--foreground` | `#FAFAF9` | Primary text |
| `--card` | `#1C1917` | Card surfaces |
| `--card-foreground` | `#F5F5F4` | Text on cards |
| `--primary` | `#E7E5E4` | Primary actions (inverted) |
| `--primary-foreground` | `#0C0A09` | Text on primary |
| `--secondary` | `#292524` | Secondary buttons |
| `--secondary-foreground` | `#E7E5E4` | Text on secondary |
| `--accent` | `#CA8A04` | Gold — unchanged in dark (brighter) |
| `--accent-foreground` | `#0C0A09` | Text on accent |
| `--muted` | `#292524` | Subtle backgrounds |
| `--muted-foreground` | `#A8A29E` | Captions, placeholders |
| `--border` | `#44403C` | Borders (warm dark) |
| `--destructive` | `#EF4444` | Errors |
| `--ring` | `#A16207` | Gold focus ring in dark mode |

> **Rule:** Never use raw hex values in components — always reference `hsl(var(--token))` via shadcn's convention.

---

### Dark / Light Mode Setup

```tsx
// app/layout.tsx — wrap with ThemeProvider
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- Strategy: `attribute="class"` — Tailwind's `dark:` variant
- Default: `"system"` — respects OS preference on first visit
- Toggle component: `components/shop/theme-toggle.tsx` — sun/moon icon in navbar
- Persistence: `next-themes` stores in `localStorage` automatically

---

### shadcn/ui Component List

Install during Task 1.1. All components use the Luxe design tokens above.

```bash
pnpm dlx shadcn@latest add \
  button card input label badge separator \
  sheet dialog toast skeleton \
  dropdown-menu navigation-menu \
  select checkbox radio-group \
  tabs accordion \
  avatar breadcrumb
```

Additional patterns:
- **ProductCard** — glass card with image, name (`font-serif`), KES price in `--accent`, stock badge
- **CartDrawer** — `Sheet` slide-over, items list, subtotal, gold CTA button
- **ThemeToggle** — icon-only button with `aria-label`, sun/moon swap animation
- **NavBar** — sticky, `backdrop-blur`, transitions to glass on scroll
- **VariantPicker** — `RadioGroup` styled as pill buttons
- **MpesaStep** — phone input + countdown ring animation
- **SkeletonCard** — `Skeleton` placeholder matching ProductCard dimensions

---

### Motion & Animation Rules

| Type | Duration | Easing |
|---|---|---|
| Micro-interactions (hover, badge) | 150 ms | `ease-out` |
| Page elements, card reveals | 300 ms | `ease-out` |
| Fluid glass morphing, sheet slides | 400–600 ms | cubic-bezier spring |
| Staggered grid entrance | 30–50 ms per item offset | `ease-out` |

- Use `transform` and `opacity` only — never animate `width`/`height`
- `prefers-reduced-motion`: wrap all non-essential animations in `@media (prefers-reduced-motion: no-preference)`
- Page load: stagger product cards with `animation-delay` (30 ms × index)
- Cart icon: scale pulse (0.95 → 1.05 → 1) when item count increments

---

### Accessibility Baseline

- Contrast: minimum 4.5:1 for body text (both themes verified)
- Focus rings: 2 px, `--ring` token, visible on all interactive elements
- Touch targets: minimum 44 × 44 px
- Icon-only buttons: always include `aria-label`
- No emoji as icons — use Lucide icons exclusively
- `aria-live="polite"` on cart count, toast notifications, M-Pesa status
- Form errors: `role="alert"`, positioned below the offending field

---

### Responsive Breakpoints

| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | 375 px | Design-first target |
| Tablet | 768 px | 2-col product grid |
| Laptop | 1024 px | 3-col grid, sidebar filters |
| Desktop | 1440 px | 4-col grid, max-w-7xl content |

---

## Component Architecture & Caching Strategy

### Guiding Principle

**Pages are thin composers. Components own their data.**

Every UI concern is a discrete Server Component that fetches and caches its own data using the Next.js 16 `use cache` directive. Pages compose these components inside `<Suspense>` boundaries — no top-level data waterfalls, no monolithic page fetches.

Client Components (`'use client'`) are used only for interactivity: cart state, theme toggle, quantity pickers, payment polling. Everything else is a Server Component.

---

### Next.js 16 Cache Directives

> Next.js 16 introduces first-class `use cache` as a stable directive (not experimental). It replaces the old `export const revalidate` pattern and enables **per-component** cache lifetimes, tagged invalidation, and streaming composition.

#### `use cache` — component-level caching

```tsx
// components/shop/featured-products.tsx
import { cacheLife, cacheTag } from 'next/cache'

async function FeaturedProducts() {
  'use cache'
  cacheLife('hours')           // named profile: revalidates after 1 hour
  cacheTag('products', 'featured')  // targeted invalidation via revalidateTag()

  const products = await fetchFeaturedProducts()
  return <ProductGrid products={products} />
}
```

#### `cacheLife()` — named TTL profiles (configure in `next.config.ts`)

| Profile | `stale` | `revalidate` | `expire` | Used by |
|---|---|---|---|---|
| `'seconds'` | 0 s | 30 s | 60 s | Live inventory badge |
| `'minutes'` | 0 s | 5 min | 10 min | Product detail shell, category page |
| `'hours'` | 0 s | 1 h | 2 h | Homepage hero, featured products |
| `'days'` | 0 s | 24 h | 48 h | Static category list, sitemap data |

```ts
// next.config.ts
const nextConfig = {
  experimental: {
    cacheHandlers: {},
  },
  cacheLife: {
    seconds: { stale: 0,   revalidate: 30,    expire: 60     },
    minutes: { stale: 0,   revalidate: 300,   expire: 600    },
    hours:   { stale: 0,   revalidate: 3600,  expire: 7200   },
    days:    { stale: 0,   revalidate: 86400, expire: 172800 },
  },
}
```

#### `cacheTag()` + `revalidateTag()` — on-demand invalidation

Every cached component tags itself. The `/api/revalidate` route calls `revalidateTag('products')` when the POS updates a product — all components sharing that tag re-fetch on the next request.

```ts
// Tagging convention
cacheTag('products')              // all product data
cacheTag('products', slug)        // specific product
cacheTag('categories')            // category list/nav
cacheTag('inventory', productId)  // live stock only
```

---

### Component Boundary Map

| Component | Directive | `cacheLife` | `cacheTag` | Notes |
|---|---|---|---|---|
| `<FeaturedProducts>` | `use cache` | `'hours'` | `products`, `featured` | Composed into homepage |
| `<CategoryNav>` | `use cache` | `'days'` | `categories` | In layout — shared across all pages |
| `<ProductGrid>` | `use cache` | `'minutes'` | `products`, `categories` | Listing + category pages |
| `<ProductDetail>` | `use cache` | `'minutes'` | `products`, slug | Static shell: name, desc, images |
| `<ProductAvailability>` | Server Component, `cache: 'no-store'` | — | — | Live qty — never cached |
| `<RelatedProducts>` | `use cache` | `'hours'` | `products`, category | Below-fold; lazy Suspense |
| `<CategoryCards>` | `use cache` | `'days'` | `categories` | Homepage category grid |
| `<OrderList>` | Server Component, no cache | — | — | Auth-gated, always fresh |
| `<Navbar>` | Server Component | `'days'` | `categories` | Category links cached; cart count is client |
| `<CartDrawer>` | `'use client'` | — | — | Zustand; pure client |
| `<ThemeToggle>` | `'use client'` | — | — | Pure client |
| `<VariantPicker>` | `'use client'` | — | — | Interactive; reads server-fetched options |
| `<MpesaStep>` | `'use client'` | — | — | Polling, timers |
| `<CheckoutForm>` | `'use client'` | — | — | Multi-step form state |

---

### Suspense + Streaming Pattern

Pages stream in parallel component subtrees. Each cached or async Server Component is wrapped in `<Suspense>` with a matching skeleton:

```tsx
// app/(shop)/page.tsx  — homepage
export default function HomePage() {
  return (
    <>
      <HeroSection />                          {/* static, no fetch */}

      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <FeaturedProducts />                   {/* use cache + cacheLife('hours') */}
      </Suspense>

      <Suspense fallback={<CategoryCardsSkeleton />}>
        <CategoryCards />                      {/* use cache + cacheLife('days') */}
      </Suspense>
    </>
  )
}
```

```tsx
// app/(shop)/products/[slug]/page.tsx
export default function ProductPage({ params }) {
  return (
    <>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail slug={params.slug} />   {/* use cache + cacheLife('minutes') */}
      </Suspense>

      <Suspense fallback={<StockBadgeSkeleton />}>
        <ProductAvailability slug={params.slug} />  {/* no-store — always live */}
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton count={4} />}>
        <RelatedProducts slug={params.slug} />  {/* use cache + cacheLife('hours') */}
      </Suspense>
    </>
  )
}
```

---

### shadcn Component → Webshop Component Map

Each shadcn primitive is extended into a domain component. No page imports shadcn directly — always via the domain wrapper.

| shadcn Primitive | Domain Component | Location |
|---|---|---|
| `Card`, `CardContent` | `ProductCard` | `components/shop/product-card.tsx` |
| `Card`, `Skeleton` | `SkeletonCard` | `components/shop/skeleton-card.tsx` |
| `Sheet` | `CartDrawer` | `components/shop/cart-drawer.tsx` |
| `NavigationMenu` | `Navbar`, `CategoryNav` | `components/shop/navbar.tsx` |
| `Badge` | `StockBadge`, `OrderStatusBadge` | `components/shop/badges.tsx` |
| `Button` | `AddToCartButton`, `CheckoutButton` | `components/shop/buttons.tsx` |
| `Dialog` | `QuickViewModal` | `components/shop/quick-view-modal.tsx` |
| `RadioGroup` | `VariantPicker` | `components/shop/variant-picker.tsx` |
| `Tabs` | `PaymentTabs` | `components/checkout/payment-tabs.tsx` |
| `Input`, `Label` | `CheckoutField` | `components/checkout/checkout-field.tsx` |
| `Skeleton` (multiple) | `ProductDetailSkeleton`, `ProductGridSkeleton`, `StockBadgeSkeleton` | `components/shop/skeletons.tsx` |
| `Avatar` | `AccountAvatar` | `components/account/account-avatar.tsx` |
| `Breadcrumb` | `ProductBreadcrumb` | `components/shop/product-breadcrumb.tsx` |
| `Toast` / `Sonner` | `useCartToast`, `usePriceChangedToast` | `lib/hooks/use-toasts.ts` |

---

## Folder Structure

```
luxe-webshop/
├── app/
│   ├── (shop)/                         # Public — no auth required
│   │   ├── layout.tsx                  # Navbar, footer, CartDrawer, TanStackQueryProvider
│   │   ├── page.tsx                    # Composer: HeroSection + FeaturedProducts + CategoryCards
│   │   ├── products/
│   │   │   ├── page.tsx                # Composer: ProductGrid (use cache, 'minutes')
│   │   │   └── [slug]/
│   │   │       └── page.tsx            # Composer: ProductDetail + ProductAvailability + RelatedProducts
│   │   ├── categories/[slug]/page.tsx  # Composer: ProductGrid filtered by category
│   │   ├── search/page.tsx             # Algolia InstantSearch (CSR)
│   │   ├── cart/page.tsx               # CSR — Zustand only
│   │   └── checkout/
│   │       ├── page.tsx                # CheckoutForm (CSR, multi-step)
│   │       ├── payment/page.tsx        # PaymentTabs: MpesaStep | CardStep
│   │       └── confirmation/page.tsx   # Server — reads order by ID
│   ├── (account)/                      # Auth-gated
│   │   ├── account/page.tsx            # AccountProfile
│   │   ├── account/orders/page.tsx     # OrderList
│   │   └── account/orders/[id]/page.tsx # OrderDetail
│   ├── auth/
│   │   ├── login/page.tsx              # Magic link form
│   │   └── callback/route.ts           # Supabase code exchange
│   ├── api/
│   │   ├── mpesa/stk-push/route.ts
│   │   ├── mpesa/callback/route.ts
│   │   ├── flutterwave/webhook/route.ts
│   │   ├── orders/route.ts
│   │   ├── orders/[id]/payment-status/route.ts
│   │   ├── orders/dispatch-notify/route.ts
│   │   ├── cart/abandon/route.ts       # Hourly cron
│   │   └── revalidate/route.ts         # revalidateTag() on product/category update
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── ui/                             # shadcn/ui primitives (auto-generated, never edit)
│   ├── shop/
│   │   ├── navbar.tsx                  # Server + client islands
│   │   ├── category-nav.tsx            # use cache, cacheLife('days')
│   │   ├── footer.tsx
│   │   ├── theme-toggle.tsx            # 'use client'
│   │   ├── cart-drawer.tsx             # 'use client' — Sheet + Zustand
│   │   ├── product-card.tsx            # Server — Card primitive
│   │   ├── skeleton-card.tsx           # Skeleton primitive
│   │   ├── skeletons.tsx               # All skeleton variants
│   │   ├── product-breadcrumb.tsx      # Breadcrumb primitive
│   │   ├── stock-badge.tsx             # Badge primitive
│   │   ├── variant-picker.tsx          # 'use client' — RadioGroup
│   │   ├── quick-view-modal.tsx        # 'use client' — Dialog
│   │   ├── add-to-cart-button.tsx      # 'use client'
│   │   ├── featured-products.tsx       # Server — use cache
│   │   ├── product-detail.tsx          # Server — use cache
│   │   ├── product-availability.tsx    # Server — no-store
│   │   ├── product-grid.tsx            # Server — use cache
│   │   ├── related-products.tsx        # Server — use cache
│   │   ├── category-cards.tsx          # Server — use cache
│   │   └── hero-section.tsx            # Static Server Component
│   ├── checkout/
│   │   ├── checkout-form.tsx           # 'use client' — multi-step
│   │   ├── checkout-field.tsx          # Input + Label wrapper
│   │   ├── payment-tabs.tsx            # Tabs: MpesaStep | CardStep
│   │   ├── mpesa-step.tsx              # 'use client' — polling + countdown
│   │   └── card-step.tsx               # 'use client' — Flutterwave Inline
│   └── account/
│       ├── account-avatar.tsx          # Avatar primitive
│       ├── account-profile.tsx         # Server
│       ├── order-list.tsx              # Server — no cache (auth-gated)
│       └── order-detail.tsx            # Server — no cache
├── lib/
│   ├── supabase/client.ts              # Browser (anon key)
│   ├── supabase/server.ts              # Server (anon key + cookie handler)
│   ├── supabase/admin.ts               # Service role (webhooks only)
│   ├── store/cart.ts                   # Zustand + localStorage persist
│   ├── actions/
│   │   ├── products.ts                 # fetchProduct, fetchProducts, fetchFeatured
│   │   ├── categories.ts               # fetchCategories
│   │   ├── orders.ts                   # createWebshopOrder, fetchOrderById
│   │   └── auth.ts                     # signInWithOtp, signOut
│   ├── hooks/
│   │   ├── use-cart.ts                 # Zustand selector hooks
│   │   └── use-toasts.ts               # Cart + price-change toast helpers
│   ├── payments/mpesa.ts
│   ├── payments/flutterwave.ts
│   ├── email/resend.ts
│   ├── email/templates/
│   │   ├── order-confirmation.tsx
│   │   ├── dispatch-notification.tsx
│   │   └── abandoned-cart.tsx
│   └── types.ts
├── proxy.ts                            # Next.js 16 Fluid compute middleware
├── next.config.ts                      # cacheLife profiles
├── vercel.json
└── .env.local
```

---

## Phase 1 — Project Setup & Data Layer

### Task 1.1 — Initialise the repo

**Subtasks**
- [ ] `pnpm create next-app@latest luxe-webshop --typescript --tailwind --app --no-src-dir`
- [ ] Install core deps: `@supabase/ssr @supabase/supabase-js zustand @tanstack/react-query`
- [ ] Install theme support: `next-themes`
- [ ] Install shadcn: `pnpm dlx shadcn@latest init` — **Luxe tokens** (stone base, CSS variables, dark mode `class`) — NOT the POS slate config
- [ ] Add shadcn components (see Design System section for full list): `button card input label badge separator sheet dialog toast skeleton dropdown-menu navigation-menu select checkbox radio-group tabs accordion avatar breadcrumb`
- [ ] Add Google Fonts import (`Cormorant` + `Montserrat`) to `app/globals.css`
- [ ] Extend `tailwind.config.ts` with `fontFamily: { serif: ['Cormorant'], sans: ['Montserrat'] }`
- [ ] Add all CSS color tokens (light + dark) to `app/globals.css` using `hsl(...)` format per shadcn convention
- [ ] Wrap `app/layout.tsx` with `ThemeProvider` (attribute="class", defaultTheme="system")
- [ ] Create `components/shop/theme-toggle.tsx` — sun/moon toggle button for the navbar
- [ ] Apply `frontend-design` + `ui-ux-pro-max` skills when building any component or page (Liquid Glass aesthetic, Cormorant/Montserrat, gold accent)
- [ ] Configure `next.config.ts` — `remotePatterns` for Supabase Storage hostname, no `unoptimized`; add `cacheLife` profiles (`seconds`, `minutes`, `hours`, `days`)
- [ ] Create `proxy.ts` at root — gates `/account/*` only, allows all other paths
- [ ] Copy `lib/supabase/client.ts`, `server.ts`, `admin.ts` from POS and adapt (anon key, not publishable key)
- [ ] Copy `lib/types.ts` from POS as base, extend with `WebshopOrder`, `CartItem`, `AbandonedCart`
- [ ] Set up `.env.local` with all required keys (see environment variables section)
- [ ] Create `vercel.json` with function timeouts and cron config

**Tests — all must pass before Task 1.2**
- [ ] `pnpm build` exits 0 with no errors
- [ ] `pnpm dev` starts and homepage renders at `localhost:3000`
- [ ] `curl localhost:3000/account` returns a 307 redirect to `/auth/login`
- [ ] `curl localhost:3000/products` returns 200 (public, no redirect)
- [ ] TypeScript: `npx tsc --noEmit` exits 0
- [ ] Supabase client can query `public_products` view from a test script
- [ ] Dark mode toggle switches theme and persists across page refresh (localStorage)
- [ ] All shadcn components render correctly in both light and dark mode with no raw hex overrides
- [ ] Cormorant and Montserrat fonts load and apply (check in DevTools → Network → Fonts)
- [ ] Contrast check: primary text passes 4.5:1 in both themes
- [ ] `next.config.ts` `cacheLife` profiles present: `seconds`, `minutes`, `hours`, `days`
- [ ] A component with `use cache` + `cacheLife('minutes')` renders without errors in dev mode

---

### Task 1.2 — Supabase migrations (run in POS repo)

> These migrations alter the shared Supabase project. Run them in
> `supabase-pos/supabase/migrations/` and apply via `supabase db push`.

**Subtasks**

**1.2a — Extend `orders` table for webshop orders**
```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'pos'
    CHECK (source IN ('pos', 'webshop')),
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'pickup'
    CHECK (delivery_method IN ('pickup', 'delivery'));
```

**1.2b — New webshop tables**
```sql
-- Guest cart + session persistence
CREATE TABLE IF NOT EXISTS webshop_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cart_data JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webshop_sessions_token ON webshop_sessions(session_token);

-- Link Supabase Auth customer accounts to POS customers table
CREATE TABLE IF NOT EXISTS webshop_customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abandoned cart recovery
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  session_token TEXT,
  cart_data JSONB NOT NULL DEFAULT '[]',
  recovery_sent_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovery
  ON abandoned_carts(recovery_sent_at) WHERE recovery_sent_at IS NULL;

-- Product reviews (used in Phase 7)
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**1.2c — Secure public views (hide `cost_price`, `supplier_id`)**
```sql
CREATE OR REPLACE VIEW public_products AS
  SELECT
    id, name, slug, description, category_id, brand,
    selling_price, compare_at_price, tax_rate,
    is_active, is_featured, has_variants, allow_backorder,
    low_stock_threshold, image_url, images, tags,
    meta_title, meta_description, created_at, updated_at
  FROM products
  WHERE is_active = true;

CREATE OR REPLACE VIEW public_inventory AS
  SELECT id, product_id, variant_id, location_id, quantity, reserved_quantity
  FROM inventory;

-- Revoke direct table access from anonymous + customer users
REVOKE SELECT ON products FROM anon, authenticated;
GRANT SELECT ON public_products TO anon, authenticated;
```

**1.2d — RLS policies**
```sql
-- Orders: customers can only see their own webshop orders
CREATE POLICY "Customers see own webshop orders"
  ON orders FOR SELECT
  USING (source = 'webshop' AND customer_email = auth.jwt() ->> 'email');

-- Categories: public read
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active categories"
  ON categories FOR SELECT USING (is_active = true);
```

**1.2e — Atomic inventory reservation function**
```sql
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_product_id UUID,
  p_variant_id UUID,
  p_location_id UUID,
  p_quantity INT
) RETURNS BOOLEAN AS $$
DECLARE v_available INT;
BEGIN
  SELECT quantity - reserved_quantity INTO v_available
  FROM inventory
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (p_variant_id IS NULL AND variant_id IS NULL))
    AND location_id = p_location_id
  FOR UPDATE;

  IF v_available >= p_quantity THEN
    UPDATE inventory
    SET reserved_quantity = reserved_quantity + p_quantity
    WHERE product_id = p_product_id AND location_id = p_location_id;
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

**Tests — all must pass before Task 1.3**
- [ ] `SELECT source, shipping_address, customer_email FROM orders LIMIT 1` succeeds (columns exist)
- [ ] `SELECT * FROM webshop_sessions LIMIT 1` returns empty (table exists)
- [ ] `SELECT * FROM public_products LIMIT 5` returns rows, no `cost_price` column in result
- [ ] `SELECT * FROM public_inventory LIMIT 5` returns rows, no `cost_price` column
- [ ] Confirm: anon user querying `products` directly gets 0 rows (RLS blocked)
- [ ] Confirm: anon user querying `public_products` gets rows
- [ ] `SELECT reserve_inventory(...)` call executes without error (function exists)

---

### Task 1.3 — Slug audit (run in POS Supabase)

**Subtasks**
- [ ] Run duplicate slug check:
  ```sql
  SELECT slug, COUNT(*) FROM products
  WHERE is_active = true GROUP BY slug HAVING COUNT(*) > 1;
  ```
- [ ] Run null/blank slug check:
  ```sql
  SELECT COUNT(*) FROM products
  WHERE is_active = true AND (slug IS NULL OR slug = '');
  ```
- [ ] Fix any duplicates or blanks manually in POS Products page or Supabase Dashboard
- [ ] Add uniqueness constraint:
  ```sql
  ALTER TABLE products ADD CONSTRAINT products_slug_unique UNIQUE (slug);
  ```

**Tests — all must pass before Phase 2**
- [ ] Duplicate slug query returns **0 rows**
- [ ] Null/blank slug query returns **0**
- [ ] Constraint exists: `\d products` shows `products_slug_unique`
- [ ] `generateStaticParams` simulation: `SELECT slug FROM public_products WHERE is_active = true` returns one row per product with no nulls

---

## Phase 2 — Authentication

### Task 2.1 — Configure Supabase Auth for webshop

**Subtasks**
- [ ] Supabase Dashboard → Authentication → Providers → enable Email OTP (Magic Link)
- [ ] Set Site URL: `https://shop.luxecollections.co.ke`
- [ ] Add `http://localhost:3000` to Additional Redirect URLs (for local dev)
- [ ] Supabase Dashboard → Authentication → Email Templates → customise Magic Link template with Luxe Collections branding
- [ ] In `user_profiles` table, confirm `role` column exists. Add trigger to auto-create profile on `auth.users` INSERT if not already present:
  ```sql
  CREATE OR REPLACE FUNCTION handle_new_webshop_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO user_profiles (id, role)
    VALUES (NEW.id, 'customer')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE OR REPLACE TRIGGER on_webshop_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_webshop_user();
  ```

**Tests**
- [ ] Send a magic link to a test email — link arrives within 60s
- [ ] Clicking the link in email redirects to `localhost:3000/auth/callback`
- [ ] After callback, `supabase.auth.getUser()` returns the authenticated user
- [ ] New user has a `user_profiles` row with `role = 'customer'`
- [ ] POS staff logging into the webshop do NOT get redirected to the POS dashboard

---

### Task 2.2 — Auth pages and callback route

**Subtasks**
- [ ] `app/auth/login/page.tsx` — email input form that calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '/auth/callback' } })`
- [ ] Show "Check your email" confirmation after submission (no redirect — stay on page)
- [ ] `app/auth/callback/route.ts` — exchanges the auth code for a session using `supabase.auth.exchangeCodeForSession(code)` then redirects to the `next` param or `/account`
- [ ] Add a loading overlay (similar to POS `TillLoader`) while auth is in progress

**Tests**
- [ ] Entering a valid email and submitting shows "Check your email" state
- [ ] Entering an invalid email shows a validation error (no network call)
- [ ] Callback route with valid code → session is set → redirected to `/account`
- [ ] Callback route with invalid/expired code → redirected to `/auth/login?error=expired`
- [ ] Already-authenticated user visiting `/auth/login` → redirected to `/account`

---

### Task 2.3 — Account pages and session management

**Subtasks**
- [ ] `app/(account)/account/page.tsx` — customer profile (name, email, order count)
- [ ] `app/(account)/account/orders/page.tsx` — list of orders for `customer_email = user.email`
- [ ] `app/(account)/account/orders/[id]/page.tsx` — order detail with status timeline
- [ ] Logout button — calls `supabase.auth.signOut()`, `window.location.replace('/')`
- [ ] `proxy.ts` — redirect unauthenticated requests to `/account/*` → `/auth/login?redirect=...`
- [ ] After login callback, redirect to the original `redirect` param if present

**Tests**
- [ ] `GET /account` without session → 307 to `/auth/login?redirect=%2Faccount`
- [ ] `GET /account` with valid session → renders profile page
- [ ] Order list shows only orders where `customer_email` matches logged-in user
- [ ] Order detail shows correct items, status, and payment info
- [ ] Logout clears the session and lands on `/` (homepage)
- [ ] After logout, `GET /account` redirects to login again

---

## Phase 3 — Storefront Pages

### Task 3.1 — Layout (navbar, footer, cart drawer)

> **Design:** Apply Liquid Glass aesthetic. Navbar uses `backdrop-blur` + semi-transparent background on scroll. Gold (`--accent`) for cart badge and active nav states. Theme toggle in navbar top-right.

**Subtasks**
- [ ] `components/shop/navbar.tsx` — logo (`font-serif`), category nav, search icon, cart icon with gold item-count badge, account icon, `ThemeToggle`
- [ ] Navbar: sticky, transparent at top → `backdrop-blur-md bg-background/80` on scroll (scroll event listener)
- [ ] Cart icon opens a `Sheet` (slide-over) showing cart items from Zustand store; gold "Checkout" CTA button
- [ ] `components/shop/footer.tsx` — links, contact, copyright; Cormorant brand name, Montserrat body
- [ ] `components/shop/category-nav.tsx` — fetches categories from `public_products` JOIN
- [ ] `app/(shop)/layout.tsx` — wraps all shop pages in navbar + footer + cart drawer + `TanStackQueryProvider`
- [ ] Cart item count badge: scale pulse animation (0.95 → 1.05 → 1, 150 ms) on increment
- [ ] All Lucide icons — no emoji; `aria-label` on every icon-only button

**Tests**
- [ ] Navbar renders on all shop pages
- [ ] Cart icon shows correct item count when items are in Zustand store
- [ ] Category nav links are correct and navigate to `/categories/[slug]`
- [ ] Cart drawer opens and closes without errors
- [ ] Footer renders correctly on mobile and desktop

---

### Task 3.2 — Homepage

> **Design:** Full-bleed hero with editorial typography (`font-serif` display headline), glass-card featured products, staggered entrance animations (30 ms × index delay).

**Subtasks**
- [ ] Hero section — full-bleed image, `font-serif` display headline, gold accent CTA button; `priority` prop on hero image
- [ ] Featured products grid — fetches `SELECT * FROM public_products WHERE is_featured = true LIMIT 8`; staggered card entrance (CSS `animation-delay`)
- [ ] Category cards grid — glass-morphism cards with `backdrop-blur`, links to `/categories/[slug]`
- [ ] `export const revalidate = 3600` (ISR — 1 hour)
- [ ] All images: explicit `width`/`height` or `aspect-ratio` to prevent CLS

**Tests**
- [ ] Page returns 200 and renders without errors
- [ ] Featured products display correct name, price (in KES), image
- [ ] No `cost_price` or internal fields visible in page source or network responses
- [ ] `curl -I` shows `Cache-Control: s-maxage=3600`
- [ ] Lighthouse mobile score ≥ 80 (baseline — will improve in Phase 7)

---

### Task 3.3 — Product listing page

> **Design:** `ProductCard` uses glass border (`border border-border/60 backdrop-blur-sm`), product name in `font-serif`, KES price in `--accent` color, stock badge as shadcn `Badge`. Skeleton loader matches card dimensions.

**Subtasks**
- [ ] `app/(shop)/products/page.tsx` — grid of all active products
- [ ] Pagination (offset-based, 24 per page)
- [ ] Filter by category (query param `?category=slug`)
- [ ] Filter by price range (query params `?min=&max=`)
- [ ] Sort: newest, price low-high, price high-low
- [ ] `components/shop/product-card.tsx` — image with `aspect-ratio: 4/5`, `font-serif` name, gold KES price, `Badge` for stock status; hover: scale(1.02) + shadow lift (300 ms ease-out)
- [ ] `components/shop/skeleton-card.tsx` — `Skeleton` primitive matching ProductCard layout (prevents CLS)
- [ ] `export const revalidate = 300` (ISR — 5 minutes)

**Tests**
- [ ] Page renders with at least one product
- [ ] `?category=bedding` shows only products in that category
- [ ] `?min=1000&max=5000` filters by price range correctly
- [ ] Pagination next/prev works and updates URL params
- [ ] Products with `stock = 0` and `allow_backorder = false` show "Out of Stock" badge
- [ ] No product exposes `cost_price` in any API response

---

### Task 3.4 — Product detail page

**Subtasks**
- [ ] `app/(shop)/products/[slug]/page.tsx`
- [ ] `generateStaticParams` — generates paths from all active product slugs
- [ ] Product gallery (image thumbnails + main image)
- [ ] `components/shop/variant-picker.tsx` — shows variant options if `has_variants = true`
- [ ] `<ProductAvailability>` — async Server Component with `cache: 'no-store'` that shows live stock count
- [ ] "Add to Cart" button — adds to Zustand store, opens cart drawer
- [ ] Related products (same category, limit 4)
- [ ] `generateMetadata` — title, description, OG image from product data
- [ ] `export const revalidate = 300` (ISR — 5 minutes for page shell)

**Tests**
- [ ] Page renders for a known product slug, returns 200
- [ ] Unknown slug returns 404 (use `notFound()`)
- [ ] Inventory badge shows live quantity (confirms `no-store` is working — change stock in POS, refresh webshop page, see update)
- [ ] Adding an in-stock item adds it to the cart store and cart drawer shows it
- [ ] Adding an out-of-stock item is blocked (button disabled)
- [ ] OG meta tags are present in page `<head>`
- [ ] `generateStaticParams` builds all active product pages at build time

---

### Task 3.5 — Category and search pages

**Subtasks**
- [ ] `app/(shop)/categories/[slug]/page.tsx` — same grid as product listing, filtered by category. `revalidate = 600`
- [ ] `app/(shop)/search/page.tsx` — Algolia `InstantSearch` with `searchClient` using search-only API key
- [ ] Search box, hits grid, filter refinements (category, price)
- [ ] Empty state for no results

**Tests**
- [ ] Category page shows only products in that category
- [ ] Invalid category slug returns 404
- [ ] Search page returns results for a known product name
- [ ] Search results do not expose `cost_price`
- [ ] Empty query shows all products (or featured)
- [ ] Search works on mobile layout

---

## Phase 4 — Cart & Checkout

### Task 4.1 — Zustand cart store

**Subtasks**
- [ ] `lib/store/cart.ts` — Zustand store with `persist` middleware to `localStorage`
- [ ] Types: `CartItem { productId, variantId?, slug, name, variantName?, sku, price, imageUrl?, quantity }`
- [ ] Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`
- [ ] Selectors: `total()`, `itemCount()`
- [ ] Price re-validation: on cart page load, fetch current prices from Supabase and compare. If any changed, show a toast notification with the difference

**Tests**
- [ ] Adding same product twice increments quantity, not duplicate rows
- [ ] Cart persists across browser refresh (localStorage)
- [ ] Cart is cleared on `clearCart()` call
- [ ] `total()` returns correct sum
- [ ] If product price changed since adding to cart, toast shows "Price updated: KES X → KES Y"
- [ ] Cart handles `out_of_stock` products added before stock ran out (shows warning on cart page)

---

### Task 4.2 — Cart page

**Subtasks**
- [ ] `app/(shop)/cart/page.tsx` — full cart review with quantity controls
- [ ] Quantity increment/decrement (max = live stock)
- [ ] Remove item button
- [ ] Order summary: subtotal, estimated shipping, total in KES
- [ ] "Proceed to Checkout" button → `/checkout`
- [ ] Empty cart state with "Continue Shopping" CTA

**Tests**
- [ ] Quantity cannot exceed live stock (capped at inventory qty)
- [ ] Removing last item shows empty cart state
- [ ] Subtotal updates when quantity changes
- [ ] "Proceed to Checkout" is disabled when cart is empty
- [ ] Cart page is CSR only — no SSR data fetching

---

### Task 4.3 — Checkout form

**Subtasks**
- [ ] `app/(shop)/checkout/page.tsx` — 3-step form
  - Step 1: Contact (email, first name, last name, phone)
  - Step 2: Delivery (pickup or delivery; address fields if delivery)
  - Step 3: Review (order summary + discount code)
- [ ] On email entry, write to `abandoned_carts` table (for recovery)
- [ ] Phone field: Kenya format validation (`07XXXXXXXX` or `+2547XXXXXXXX`)
- [ ] Server action `createWebshopOrder()` — validates prices, calls `reserve_inventory()`, creates order (status: `pending`), returns `orderId`
- [ ] On success, redirect to `/checkout/payment?orderId=...`

**Tests**
- [ ] All form fields validate before submitting (empty, invalid email, invalid phone)
- [ ] Invalid phone number (not Kenyan format) shows an error
- [ ] Address fields are required only when delivery is selected
- [ ] `createWebshopOrder()` creates a row in `orders` with `source = 'webshop'` and `status = 'pending'`
- [ ] `reserve_inventory()` is called for each line item — inventory `reserved_quantity` increases
- [ ] If stock runs out between cart add and checkout, order creation fails with a clear error message
- [ ] `abandoned_carts` row is created when email is entered (before order is placed)
- [ ] Discount code field accepts known codes and rejects unknown ones

---

## Phase 5 — Payments

### Task 5.1 — M-Pesa STK Push

**Subtasks**
- [ ] `lib/payments/mpesa.ts` — Daraja wrapper:
  - `getAccessToken()` — `POST oauth/v1/generate?grant_type=client_credentials`
  - `initiateSTKPush({ phone, amount, orderId, orderNumber })` — normalises phone, generates password, POSTs to stkpush endpoint
  - `queryTransactionStatus(checkoutRequestId)` — Daraja Transaction Status Query (fallback if callback never arrives)
- [ ] `app/api/mpesa/stk-push/route.ts` — calls `initiateSTKPush`, stores `CheckoutRequestID` on the order row, returns `{ checkoutRequestId }`
- [ ] `app/api/mpesa/callback/route.ts`:
  - Verifies Safaricom IP range (`196.201.214.200/24`) in production
  - Matches `CheckoutRequestID` to order
  - On `ResultCode === 0`: updates order to `payment_status = 'paid'`, `status = 'processing'`
  - Inserts into `payments` table (idempotent — unique constraint on `mpesa_receipt`)
  - Decrements inventory (converts reserved → actual decrement)
  - Sends order confirmation email
- [ ] `app/api/orders/[id]/payment-status/route.ts` — polls order `payment_status` (rate-limited, max 30/min)
- [ ] `app/(shop)/checkout/payment/page.tsx` — shows phone number input, "Pay via M-Pesa" button, polling UI with countdown timer (90s max), timeout fallback message

**Tests (run in Daraja sandbox first)**
- [ ] STK Push is initiated and phone receives the prompt (sandbox test number)
- [ ] `CheckoutRequestID` is stored on the order row after initiation
- [ ] Simulated successful callback (ResultCode 0) → order `payment_status` updates to `'paid'`
- [ ] Simulated failed callback (ResultCode 1032) → order stays `'pending'`, user sees failure message
- [ ] Duplicate callback with same `mpesa_receipt` is rejected (idempotency)
- [ ] Polling endpoint returns `'paid'` after callback fires
- [ ] Polling times out after 90s → shows "Confirming your payment..." message
- [ ] `queryTransactionStatus` fallback works when callback doesn't arrive within 5 minutes
- [ ] Inventory `reserved_quantity` converts to actual decrement after payment confirmation
- [ ] IP verification rejects requests from non-Safaricom IPs in production mode

---

### Task 5.2 — Flutterwave card payments (fallback)

**Subtasks**
- [ ] `lib/payments/flutterwave.ts` — webhook signature verification
- [ ] `app/(shop)/checkout/payment/page.tsx` — add "Pay by Card" tab using Flutterwave Inline JS SDK
- [ ] `app/api/flutterwave/webhook/route.ts` — verifies `FLW-Signature` header, updates order on success
- [ ] Same post-payment flow as M-Pesa: inventory decrement + confirmation email

**Tests**
- [ ] Flutterwave payment modal opens correctly (sandbox)
- [ ] Successful card payment → order updates to `payment_status = 'paid'`
- [ ] Webhook with invalid signature returns 403
- [ ] Duplicate webhook event is handled idempotently

---

### Task 5.3 — Order confirmation page

**Subtasks**
- [ ] `app/(shop)/checkout/confirmation/page.tsx` — reads order by ID from URL param
- [ ] Shows order number, items, total, payment method, expected fulfilment
- [ ] "Create account" prompt for guests (if no active session)
- [ ] Cart is cleared (`clearCart()`) on this page mount
- [ ] Link to `account/orders/[id]` if authenticated

**Tests**
- [ ] Page shows correct order details for a completed order
- [ ] Cart is empty after landing on confirmation page
- [ ] "Create account" prompt is shown for guest users and hidden for authenticated users
- [ ] Visiting confirmation page for an order that belongs to a different email returns 404

---

## Phase 6 — Email Automation

### Task 6.1 — Order confirmation email

**Subtasks**
- [ ] Add `orders@luxecollections.co.ke` sender to Resend domain DNS
- [ ] `lib/email/templates/order-confirmation.tsx` — React Email template: order number, items table with images, total in KES, M-Pesa receipt number, delivery method, "Track your order" link
- [ ] Call `resend.emails.send()` inside `app/api/mpesa/callback` and `app/api/flutterwave/webhook` after payment confirmed

**Tests**
- [ ] Email is received at the customer email after a test payment
- [ ] Email contains correct order number, item names, prices in KES
- [ ] "Track your order" link goes to `/account/orders/[id]`
- [ ] Email renders correctly in Gmail and Apple Mail (check with Resend's email testing)
- [ ] No email is sent for failed payments

---

### Task 6.2 — Dispatch notification email

**Subtasks**
- [ ] `lib/email/templates/dispatch-notification.tsx` — "Your order is on its way / ready for pickup" template
- [ ] Supabase Dashboard → Database Webhooks → `orders` table UPDATE where `source = 'webshop' AND status = 'completed'` → POST to `/api/orders/dispatch-notify`
- [ ] `app/api/orders/dispatch-notify/route.ts` — verifies webhook secret, sends dispatch email

**Tests**
- [ ] Updating an order to `status = 'completed'` in Supabase triggers the webhook
- [ ] Dispatch email is received with correct tracking number (if delivery)
- [ ] Pickup email uses pickup address and hours instead of tracking number
- [ ] Webhook with invalid secret returns 401
- [ ] Email is NOT sent when order transitions to other statuses (only `completed`)

---

### Task 6.3 — Abandoned cart recovery

**Subtasks**
- [ ] `app/api/cart/abandon/route.ts` — Vercel cron (hourly):
  - Finds `abandoned_carts` rows where `recovery_sent_at IS NULL AND recovered_at IS NULL AND created_at < NOW() - INTERVAL '1 hour'`
  - Sends recovery email with cart contents and restore link
  - Sets `recovery_sent_at = NOW()`
- [ ] `lib/email/templates/abandoned-cart.tsx` — shows cart items with images, "Complete your purchase" CTA with restore link
- [ ] Cart restore link encodes `session_token` — on clicking, restores cart from `abandoned_carts.cart_data` into Zustand store

**Tests**
- [ ] Cron route rejects requests without valid `CRON_SECRET` header
- [ ] Row with `created_at` 2h ago and no `recovery_sent_at` receives the email
- [ ] Row with `recovered_at` set is skipped (already purchased)
- [ ] Cart restore link correctly restores items to the Zustand cart
- [ ] `recovery_sent_at` is set after email is sent — second cron run skips the same row

---

## Phase 7 — SEO & Performance

### Task 7.1 — Metadata and structured data

**Subtasks**
- [ ] `generateMetadata` on all product and category pages
- [ ] `components/shop/product-schema.tsx` — JSON-LD `Product` schema with `InStock`/`OutOfStock` based on live inventory
- [ ] `app/sitemap.ts` — dynamic sitemap from `public_products` and `categories`
- [ ] `app/robots.ts` — disallow `/api/`, `/account/`, `/checkout/`
- [ ] OG images — `next/og` `ImageResponse` for product pages (product image + name + price overlay)

**Tests**
- [ ] `curl https://shop.luxecollections.co.ke/sitemap.xml` returns valid XML with product URLs
- [ ] `curl https://shop.luxecollections.co.ke/robots.txt` shows correct disallow rules
- [ ] Product detail page `<head>` contains `og:title`, `og:image`, `og:description`
- [ ] JSON-LD validates at schema.org validator for a product page
- [ ] OG image is 1200×630 and renders correctly in link previews

---

### Task 7.2 — On-demand cache invalidation

**Subtasks**
- [ ] `app/api/revalidate/route.ts` — verifies `REVALIDATE_SECRET` header; calls `revalidateTag('products')` and `revalidateTag(slug)` for targeted invalidation (replaces `revalidatePath` — tags are the Next.js 16 preferred mechanism)
- [ ] Supabase Dashboard → Database Webhooks → `products` table UPDATE → POST to webshop `/api/revalidate` with `{ slug, tags: ['products'] }`
- [ ] Same webhook for `categories` UPDATE → `revalidateTag('categories')`
- [ ] Test by updating a product in the POS and checking the webshop cache is busted within 5 seconds

**Tests**
- [ ] Route rejects requests without valid `REVALIDATE_SECRET` header
- [ ] Updating a product in POS → `FeaturedProducts`, `ProductDetail`, and `ProductGrid` components all reflect updated data within 5 seconds (tag propagation confirmed)
- [ ] Revalidation does not crash if slug doesn't exist
- [ ] `CategoryNav` re-fetches after a category is updated (confirms `revalidateTag('categories')` works)

---

### Task 7.3 — Performance audit

**Subtasks**
- [ ] Run Lighthouse on homepage, product listing, product detail (mobile, simulated 4G)
- [ ] Fix any LCP issues: lazy-load below-fold images, `priority` prop on hero image
- [ ] Fix any CLS issues: explicit `width`/`height` on all images
- [ ] Enable Vercel Speed Insights
- [ ] Verify all Supabase Storage image URLs use `?width=` transform params for responsive sizing

**Tests**
- [ ] Lighthouse mobile score: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 95
- [ ] LCP ≤ 2.5s on product detail page (simulated 4G)
- [ ] No console errors on any storefront page
- [ ] `pnpm build` output shows product pages as `○ (Static)` or ISR, not `ƒ (Dynamic)`

---

## Phase 8 — POS Integration (minor changes to POS repo)

### Task 8.1 — Webshop orders tab in POS

**Subtasks**
- [ ] Add "Online Orders" filter tab to the existing POS orders page
- [ ] Show `Online Order` badge on orders where `source = 'webshop'`
- [ ] Show shipping address for `delivery_method = 'delivery'`
- [ ] Add tracking number input field that saves to `orders.tracking_number`
- [ ] Status update from `processing` → `completed` triggers dispatch email (via webhook set up in Task 6.2)

**Tests**
- [ ] A webshop order placed in the storefront appears in the POS orders page within 5 seconds
- [ ] `Online Order` badge is visible and `POS` orders do not show this badge
- [ ] Staff can enter a tracking number and it saves correctly
- [ ] Setting status to `completed` fires the dispatch email (verify in Resend logs)
- [ ] POS orders are not affected by any webshop-specific changes

---

## Deployment

### Vercel configuration

```json
// vercel.json
{
  "functions": {
    "app/api/mpesa/**": { "maxDuration": 30 },
    "app/api/orders/**": { "maxDuration": 15 },
    "app/api/flutterwave/**": { "maxDuration": 15 }
  },
  "crons": [
    { "path": "/api/cart/abandon", "schedule": "0 * * * *" }
  ]
}
```

### Environment variables

```bash
# Supabase (same project as POS)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=          # Anon key (not publishable key)
SUPABASE_SERVICE_ROLE_KEY=              # Server-only

# Algolia
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=         # Search-only — safe to expose
ALGOLIA_ADMIN_API_KEY=                  # Server-only

# M-Pesa Daraja
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://shop.luxecollections.co.ke/api/mpesa/callback
MPESA_ENV=production                    # 'sandbox' for preview deployments

# Flutterwave
NEXT_PUBLIC_FLW_PUBLIC_KEY=
FLW_SECRET_KEY=
FLW_SECRET_HASH=

# Resend
RESEND_API_KEY=                         # Same key as POS

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Security
CRON_SECRET=                            # Different from POS CRON_SECRET
REVALIDATE_SECRET=
DISPATCH_WEBHOOK_SECRET=
```

### Environments

| Environment | Supabase | M-Pesa | Domain |
|---|---|---|---|
| Production | Live project | `MPESA_ENV=production` | shop.luxecollections.co.ke |
| Vercel preview | Same project | `MPESA_ENV=sandbox` | `*.vercel.app` |
| Local dev | Same project | Sandbox + ngrok for Daraja callbacks | localhost:3000 |

---

## The 5 Riskiest Parts

| Risk | Details | Mitigation |
|---|---|---|
| **Daraja approval delay** | Requires registered Kenyan business + Paybill/Till + Safaricom review (1–4 weeks) | Apply immediately. Use Flutterwave M-Pesa gateway as fallback — no separate Daraja account needed |
| **Inventory race conditions** | 10 concurrent buyers on the last unit all pass availability check without row locking | The `reserve_inventory(FOR UPDATE)` function is mandatory before Phase 5 goes live |
| **M-Pesa callback unreliability** | Callbacks arrive late, duplicated, or not at all | Build `queryTransactionStatus` fallback. Show "confirming..." on timeout. Never tell customer payment failed until you've queried Daraja directly |
| **RLS gaps** | Adding webshop `authenticated` users to same Supabase project can leak POS data | Run `SELECT tablename, policyname FROM pg_policies` audit before Phase 5. `REVOKE` on `products` base table is non-negotiable |
| **Missing/duplicate slugs** | Blank or duplicate slugs crash `generateStaticParams` at build time | Task 1.3 slug audit must return zero issues before any page code is written |

---

## Phase Gate Summary

| Phase | Gate condition before moving on |
|---|---|
| 1 | Build passes, all SQL tests pass, slugs are clean; dark/light toggle works; Cormorant + Montserrat load; contrast 4.5:1 both themes |
| 2 | Full magic link flow works end-to-end, `/account` is gated |
| 3 | All storefront pages render, no `cost_price` leaks, Lighthouse ≥ 80 mobile; no raw hex in components; glass cards and gold accent visible in both themes |
| 4 | Cart persists, checkout creates a `pending` order, inventory is reserved |
| 5 | Sandbox M-Pesa payment updates order to `paid`, inventory decrements |
| 6 | All 3 emails received correctly in test inbox |
| 7 | Lighthouse mobile ≥ 85, sitemap valid, no console errors |
| 8 | Webshop order visible in POS, dispatch email fires on status change |

---

## Key POS Files to Reference

| File | Why |
|---|---|
| `lib/types.ts` | Base for webshop types — copy and extend |
| `lib/actions/orders.ts` | `createOrder` pattern for the webshop order creation |
| `lib/supabase/proxy.ts` | Invert the logic: allow public, gate only `/account/*` |
| `lib/services/email.ts` | Resend integration pattern and `formatKES` |
| `supabase/migrations/` | Follow the same file naming and SQL conventions |
| `components/ui/till-loader.tsx` | Reuse the loading overlay in the webshop auth flow |

---

## Manual Setup Steps (post-deploy checklist)

These cannot be done in code — complete them after the webshop is deployed to Vercel.

---

### 1. Supabase Dispatch Webhook

Fires `sendDispatchEmail` when a webshop order status changes to `completed`.

**Go to:** `https://supabase.com/dashboard/project/cqznlauqkconcrurqeaf/database/hooks`

Click **Create a new hook** and fill in:

| Field | Value |
|---|---|
| Name | `webshop_order_dispatch` |
| Table | `orders` |
| Events | `UPDATE` |
| Type | HTTP Request |
| Method | `POST` |
| URL | `https://shop.luxecollections.co.ke/api/orders/dispatch-notify` |

Under **HTTP Headers**, add:
```
x-webhook-secret   <value of DISPATCH_WEBHOOK_SECRET from .env.local>
```

> **Local dev:** use ngrok (`ngrok http 3000`) and temporarily set the URL to your ngrok HTTPS URL.

**Test:** In Supabase Table Editor, update a webshop order's `status` to `completed` — confirm the dispatch email arrives in Resend logs.

---

### 2. Resend — Verify `luxecollections.co.ke` and Add Sender

**Step 1 — Add the domain:**

Go to `https://resend.com/domains` → **Add Domain** → enter `luxecollections.co.ke`.

Resend will give you DNS records to add in your domain provider (Cloudflare, Namecheap, etc.):

| Type | Name | Value |
|---|---|---|
| TXT | `@` | `v=spf1 include:amazonses.com ~all` |
| CNAME | `resend._domainkey` | *(exact value shown by Resend)* |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |

**Step 2 — Verify:** Back in Resend dashboard, click **Verify DNS**. All three records must go green (can take up to 30 minutes to propagate).

**Step 3 — No code change needed.** `lib/email/resend.ts` already uses `FROM = "Luxe Collections <orders@luxecollections.co.ke>"`.

**Test:**
```bash
cd ~/Desktop/Shop/luxe-webshop
node -e "
const { Resend } = require('resend');
const r = new Resend('<your RESEND_API_KEY>');
r.emails.send({
  from: 'orders@luxecollections.co.ke',
  to: 'kimutaiwycliff90@gmail.com',
  subject: 'Sender test',
  html: '<p>Resend sender verified.</p>'
}).then(console.log);
"
```

---

### 3. Safaricom Daraja — M-Pesa Production Approval

Allow **1–4 weeks**. Start this immediately after launch.

**Step 1 — Prerequisites:**
- Registered Kenyan business (sole trader or limited company) with a KRA PIN
- Paybill or Till number (apply through your bank or Safaricom Business if you don't have one — bring: business registration certificate, KRA PIN, national ID)

**Step 2 — Register on Daraja:**
- Go to `https://developer.safaricom.co.ke` → Sign Up
- Dashboard → **My Apps** → **Add a new app** → select `Lipa na M-Pesa Online` (STK Push)
- Fill in business details and your Paybill/Till number; submit for review

**Step 3 — On approval, collect your production credentials:**

```
MPESA_CONSUMER_KEY=       # production key
MPESA_CONSUMER_SECRET=    # production secret
MPESA_SHORTCODE=          # your Paybill or Till number
MPESA_PASSKEY=            # from Daraja dashboard → app settings
```

**Step 4 — Set production env vars in Vercel:**

In your Vercel project (webshop) → Settings → Environment Variables, set for **Production** only:

```
MPESA_ENV=production
MPESA_CONSUMER_KEY=<prod key>
MPESA_CONSUMER_SECRET=<prod secret>
MPESA_SHORTCODE=<shortcode>
MPESA_PASSKEY=<passkey>
MPESA_CALLBACK_URL=https://shop.luxecollections.co.ke/api/mpesa/callback
```

> **While waiting for approval:** keep `MPESA_ENV=sandbox` in Vercel Preview. Use Daraja sandbox test credentials and test phone `254708374149` with any 4-digit PIN.

---

### Manual Steps Status

| Step | Status |
|---|---|
| Supabase dispatch webhook | ⬜ Pending |
| Resend domain DNS verification | ⬜ Pending |
| Resend sender test | ⬜ Pending |
| Daraja Paybill/Till application | ⬜ Pending |
| Daraja production app created | ⬜ Pending |
| Production M-Pesa env vars set in Vercel | ⬜ Pending |
