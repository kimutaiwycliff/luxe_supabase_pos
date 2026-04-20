# Luxe Collections Webshop — Implementation Plan

> **Separate repo, same Supabase backend.**
> The webshop is a public-facing storefront that shares the POS database but runs as an independent Next.js app on its own Vercel project.

---

## Architecture Overview

```
Supabase Project (shared)
├── POS App  → github: luxe_supabase_pos   → vercel: pos.luxecollections.co.ke  (staff-only)
└── Webshop  → github: luxe_webshop (new)  → vercel: shop.luxecollections.co.ke (public)
```

Both apps point at the same Supabase project. The webshop uses the **anon key** for the browser client and the **service role key** only in server-side webhook/order handlers. The POS continues to operate completely independently.

---

## Stack

| Concern | Choice | Reasoning |
|---|---|---|
| Framework | Next.js 16 (App Router) | Matches POS tooling; ISR is first-class |
| Language | TypeScript 5 | Consistency with POS |
| Styling | Tailwind CSS + shadcn/ui | Same primitives, different design tokens |
| Package manager | pnpm | Matches POS |
| Cart state | Zustand + localStorage | SSR-safe, no server round-trips |
| Server state | TanStack Query | Better stale-while-revalidate than SWR for storefronts |
| Payments (primary) | Safaricom Daraja M-Pesa STK Push | Kenya-first, no FX friction |
| Payments (fallback) | Flutterwave | Native KES card support; also covers M-Pesa if Daraja approval is delayed |
| Email | Resend (same account, new templates) | Already verified domain |
| Search | Algolia (same indexes, search-only key) | Zero duplication |
| Rate limiting | Upstash Redis | Vercel-native, generous free tier |
| Deployment | Vercel (separate project) | Independent scaling, no shared blast radius |

---

## Folder Structure

```
luxe-webshop/
├── app/
│   ├── (shop)/                         # Public storefront — no auth required
│   │   ├── layout.tsx                  # Navbar, footer, cart drawer
│   │   ├── page.tsx                    # Homepage (ISR 1h)
│   │   ├── products/
│   │   │   ├── page.tsx                # Catalogue (ISR 5min)
│   │   │   └── [slug]/page.tsx         # Product detail (ISR 5min + live qty)
│   │   ├── categories/[slug]/page.tsx
│   │   ├── search/page.tsx             # Algolia-powered (SSR)
│   │   ├── cart/page.tsx               # CSR (Zustand)
│   │   └── checkout/
│   │       ├── page.tsx                # Contact + shipping form
│   │       ├── payment/page.tsx        # M-Pesa / Card step
│   │       └── confirmation/page.tsx
│   ├── (account)/                      # Auth-gated customer portal
│   │   ├── account/page.tsx
│   │   └── account/orders/[id]/page.tsx
│   ├── api/
│   │   ├── mpesa/
│   │   │   ├── stk-push/route.ts       # Initiate STK Push
│   │   │   └── callback/route.ts       # Safaricom async webhook
│   │   ├── flutterwave/
│   │   │   └── webhook/route.ts        # Card payment webhook
│   │   ├── orders/
│   │   │   ├── route.ts                # Create webshop order
│   │   │   └── [id]/payment-status/route.ts  # Browser polling endpoint
│   │   ├── cart/
│   │   │   └── abandon/route.ts        # Hourly cron for recovery emails
│   │   └── revalidate/route.ts         # ISR on-demand trigger from POS webhook
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── ui/                             # shadcn/ui primitives
│   ├── shop/
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   ├── product-card.tsx
│   │   ├── product-gallery.tsx
│   │   ├── variant-picker.tsx
│   │   ├── add-to-cart-button.tsx
│   │   ├── cart-drawer.tsx
│   │   ├── cart-summary.tsx
│   │   └── category-nav.tsx
│   └── checkout/
│       ├── checkout-form.tsx
│       ├── mpesa-step.tsx
│       └── card-step.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client (anon key)
│   │   ├── server.ts                   # Server client (service role for sensitive ops)
│   │   └── admin.ts                    # Service role — webhooks only
│   ├── store/
│   │   └── cart.ts                     # Zustand cart store
│   ├── actions/
│   │   ├── products.ts
│   │   ├── categories.ts
│   │   ├── orders.ts
│   │   └── auth.ts
│   ├── payments/
│   │   ├── mpesa.ts                    # Daraja SDK wrapper
│   │   └── flutterwave.ts
│   ├── email/
│   │   ├── resend.ts
│   │   └── templates/
│   │       ├── order-confirmation.tsx
│   │       ├── dispatch-notification.tsx
│   │       └── abandoned-cart.tsx
│   └── types.ts                        # Copied + extended from POS lib/types.ts
├── middleware.ts                        # Only gates /account/* routes
├── next.config.ts
├── vercel.json
└── .env.local
```

---

## Phase 1 — Supabase Data Layer (Weeks 1–2)

### 1.1 Extend the `orders` table

> Do NOT create a separate webshop orders table. Add a `source` column so POS staff see webshop orders in real time.

```sql
-- Migration: extend orders for webshop
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

### 1.2 New tables

```sql
-- Guest cart persistence
CREATE TABLE webshop_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  cart_data JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_webshop_sessions_token ON webshop_sessions(session_token);

-- Link Supabase Auth customer accounts to POS customers table
CREATE TABLE webshop_customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abandoned cart recovery
CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  session_token TEXT,
  cart_data JSONB NOT NULL DEFAULT '[]',
  recovery_sent_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX idx_abandoned_carts_recovery
  ON abandoned_carts(recovery_sent_at) WHERE recovery_sent_at IS NULL;

-- Product reviews (Phase 2)
CREATE TABLE product_reviews (
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

### 1.3 Secure public view (hides `cost_price`, `supplier_id`)

```sql
CREATE VIEW public_products AS
  SELECT
    id, name, slug, description, category_id, brand,
    selling_price, compare_at_price, tax_rate,
    is_active, is_featured, has_variants, allow_backorder,
    low_stock_threshold, image_url, images, tags,
    meta_title, meta_description, created_at, updated_at
  FROM products
  WHERE is_active = true;

-- Revoke direct table access so anon users never see cost_price
REVOKE SELECT ON products FROM anon, authenticated;
GRANT SELECT ON public_products TO anon, authenticated;

-- Inventory view (quantity only — no cost data)
CREATE VIEW public_inventory AS
  SELECT id, product_id, variant_id, location_id, quantity, reserved_quantity
  FROM inventory;
```

### 1.4 RLS policies

```sql
-- Webshop customers can only see their own orders
CREATE POLICY "Customers see own webshop orders"
  ON orders FOR SELECT
  USING (source = 'webshop' AND customer_email = auth.jwt() ->> 'email');

-- Public can read active categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active categories"
  ON categories FOR SELECT USING (is_active = true);
```

### 1.5 Atomic inventory reservation (prevents race conditions)

```sql
-- Locks the row, checks availability, reserves quantity atomically
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

### 1.6 Slug audit (run before building product pages)

```sql
-- Must return zero rows before proceeding
SELECT slug, COUNT(*) FROM products
WHERE is_active = true
GROUP BY slug HAVING COUNT(*) > 1;

-- Must return zero
SELECT COUNT(*) FROM products
WHERE is_active = true AND (slug IS NULL OR slug = '');

-- Add uniqueness constraint
ALTER TABLE products ADD CONSTRAINT products_slug_unique UNIQUE (slug);
```

---

## Phase 2 — Storefront Pages (Week 3)

| Route | Rendering | Data |
|---|---|---|
| `/` | ISR (revalidate: 3600) | Featured products, category nav |
| `/products` | ISR (revalidate: 300) | All active products, filters, pagination |
| `/products/[slug]` | ISR (revalidate: 300) + `no-store` for live qty | Product, variants, availability |
| `/categories/[slug]` | ISR (revalidate: 600) | Category metadata + products |
| `/search` | SSR | Algolia hits, filters |
| `/cart` | CSR (Zustand) | Cart store only |
| `/checkout/*` | CSR + server validation | Cart, customer form, payments |
| `/account/*` | SSR (auth required) | Orders, profile |

### Hybrid rendering for product detail

Cache the page shell but fetch inventory quantity live on every request:

```typescript
// app/(shop)/products/[slug]/page.tsx
export const revalidate = 300 // 5 minutes for the page shell

// Separate async component — bypasses ISR cache
async function ProductAvailability({ productId }: { productId: string }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/public_inventory?product_id=eq.${productId}`,
    {
      cache: 'no-store', // always live
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }
    }
  )
  const [inv] = await res.json()
  const available = (inv?.quantity ?? 0) - (inv?.reserved_quantity ?? 0)
  // Render: "In Stock" / "Low Stock (3 left)" / "Out of Stock"
}
```

---

## Phase 3 — Cart & Checkout (Week 4)

### Zustand cart store

```typescript
// lib/store/cart.ts
interface CartItem {
  productId: string
  variantId?: string
  slug: string
  name: string
  variantName?: string
  sku: string
  price: number       // price at time of add — re-validated on checkout
  imageUrl?: string
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, variantId: string | undefined, qty: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}
// Persist with Zustand persist middleware → localStorage
```

Re-validate all prices server-side before creating the order. If any price changed since the item was added to cart, notify the customer before proceeding.

### Checkout steps

```
Step 1: Contact + Shipping
  ├── Email (required even for guests)
  ├── First name, last name
  ├── Phone number (required — M-Pesa uses this)
  ├── Delivery method: "Ship to me" or "Pick up in store"
  └── Shipping address (shown only if delivery selected)

Step 2: Order Review
  ├── Cart summary with current server-validated prices
  ├── Discount code input
  └── Subtotal, shipping fee, total in KES

Step 3: Payment
  ├── M-Pesa STK Push (shown first — primary)
  └── Card via Flutterwave (shown second — fallback)

Step 4: Confirmation
  ├── Order number and expected fulfilment time
  └── "Create an account" prompt for guests
```

### Server action for order creation

```typescript
// lib/actions/orders.ts
export async function createWebshopOrder(data: WebshopOrderData) {
  const supabase = getSupabaseAdmin() // service role — bypasses RLS

  // 1. Re-validate prices and availability for each item
  // 2. Call reserve_inventory() for each line item (atomic)
  // 3. Create or find customer in customers table
  // 4. INSERT into orders (source: 'webshop', status: 'pending', payment_status: 'pending')
  // 5. INSERT order_items
  // 6. Write to abandoned_carts (for recovery if payment abandoned)
  // 7. Return { orderId, orderNumber }
  // NOTE: Do NOT decrement inventory here — wait for payment confirmation
}
```

---

## Phase 4 — M-Pesa Integration (Week 5)

### Payment flow

```
Browser
  └─► POST /api/mpesa/stk-push
        └─► Daraja API: sends STK Push prompt to customer's phone
              └─► Browser polls GET /api/orders/[id]/payment-status every 3s (max 90s)
                                                  ▲
Safaricom (async, 10–30s later)                   │
  └─► POST /api/mpesa/callback                    │
        ├─► Verify Safaricom IP range             │
        ├─► Match CheckoutRequestID to order      │
        ├─► UPDATE order: payment_status='paid'   │
        ├─► Decrement inventory (service role)    │
        ├─► Send order confirmation email         │
        └─► Browser detects 'paid' ──────────────┘
              └─► Redirect to /checkout/confirmation
```

### Environment variables

```bash
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=            # Your Paybill or Till number
MPESA_PASSKEY=              # From Safaricom portal
MPESA_CALLBACK_URL=https://shop.luxecollections.co.ke/api/mpesa/callback
MPESA_ENV=production        # 'sandbox' for preview deployments
```

### STK Push route

```typescript
// app/api/mpesa/stk-push/route.ts
export async function POST(req: Request) {
  // 1. Authenticate with Daraja (POST oauth/v1/generate)
  // 2. Normalise phone: 07XXXXXXXX → 2547XXXXXXXX
  // 3. Generate password: base64(shortcode + passkey + timestamp)
  // 4. POST to mpesa/stkpush/v1/processrequest
  // 5. Store CheckoutRequestID in orders table for callback matching
  // 6. Return { checkoutRequestId }
}
```

### Callback route

```typescript
// app/api/mpesa/callback/route.ts
const SAFARICOM_IPS = ['196.201.214.200', '196.201.214.206']

export async function POST(req: Request) {
  // Verify Safaricom IP in production
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]
  if (process.env.NODE_ENV === 'production' &&
      !SAFARICOM_IPS.some(a => ip?.startsWith(a))) {
    return new Response('Forbidden', { status: 403 })
  }

  const { ResultCode, CheckoutRequestID, CallbackMetadata } = body.Body.stkCallback

  if (ResultCode === 0) {
    const receipt = CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber').Value
    // UPDATE order: payment_status='paid', status='processing'
    // INSERT into payments (idempotent — unique constraint on reference_number)
    // Decrement inventory via admin client
    // Send order confirmation email via Resend
  }
  return new Response('OK', { status: 200 })
}
```

### Polling route

```typescript
// app/api/orders/[id]/payment-status/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Rate limit: max 30 polls per order per minute
  const { data } = await supabase
    .from('orders')
    .select('payment_status, status')
    .eq('id', params.id)
    .eq('source', 'webshop') // Never expose POS order data
    .single()
  return Response.json({ status: data?.payment_status })
}
```

---

## Phase 5 — Customer Accounts + Card Payments (Weeks 6–8)

### Authentication strategy

Both POS staff and webshop customers use the same Supabase Auth instance, differentiated by `user_profiles.role`:
- POS: `role = 'admin'` or `role = 'staff'`
- Webshop customers: `role = 'customer'`

**Recommended auth method: Magic Link** (not password) — familiar pattern for Kenyan mobile users, similar to M-Pesa OTP confirmations. No password to forget.

### Webshop `middleware.ts`

```typescript
// Only protect /account routes — storefront is fully public
const protectedPaths = ['/account']
if (protectedPaths.some(p => req.nextUrl.pathname.startsWith(p)) && !user) {
  return NextResponse.redirect(
    new URL(`/auth/login?redirect=${encodeURIComponent(req.nextUrl.pathname)}`, req.url)
  )
}
```

### Guest → account upgrade

After order confirmation for guest checkouts, prompt: *"Save your details for next time."* If accepted, call `supabase.auth.signUp()` with their order email. A `webshop_customers` row links the new `auth.users.id` to the `customers` row created during the order.

### Flutterwave card payments

```typescript
// Client component — PCI compliant (no card data touches your server)
import FlutterwaveCheckout from 'flutterwave-react-v3'

const config = {
  public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY,
  tx_ref: orderId,
  amount: orderTotal,
  currency: 'KES',
  payment_options: 'card,mobilemoney',
  customer: { email, phone_number: phone, name },
  customizations: {
    title: 'Luxe Collections Kenya',
    logo: 'https://shop.luxecollections.co.ke/logo.png'
  }
}
```

Webhook from Flutterwave hits `/api/flutterwave/webhook` and is verified using `FLW-Signature` header HMAC-SHA256 against `FLW_SECRET_HASH`.

---

## Phase 6 — Email Automation (Week 9)

Add `orders@luxecollections.co.ke` as a sender in the existing Resend domain (add DNS record alongside the existing sender).

| Email | Trigger | Mechanism |
|---|---|---|
| Order confirmation | M-Pesa/card callback confirmed | API route → Resend |
| Dispatch notification | POS staff sets `status = 'completed'` | Supabase DB webhook → Edge Function → Resend |
| Abandoned cart recovery | 1h after cart entry with no order | Vercel cron `/api/cart/abandon` (hourly) |
| Welcome email | Customer account created | Supabase Auth hook → Resend |

### Abandoned cart cron logic

```typescript
// app/api/cart/abandon/route.ts
// Vercel cron: "0 * * * *" (every hour)
export async function GET(req: Request) {
  // Verify CRON_SECRET header
  // Find rows: recovery_sent_at IS NULL
  //            AND recovered_at IS NULL
  //            AND created_at < NOW() - INTERVAL '1 hour'
  // Send recovery email with cart contents + restore link
  // Set recovery_sent_at = NOW()
}
```

---

## Phase 7 — SEO & Performance (Weeks 10–12)

### Metadata

```typescript
// app/(shop)/products/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getPublicProductBySlug(params.slug)
  return {
    title: `${product.meta_title || product.name} | Luxe Collections Kenya`,
    description: product.meta_description || product.description?.slice(0, 155),
    openGraph: {
      images: [{ url: product.image_url, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `https://shop.luxecollections.co.ke/products/${product.slug}`,
    },
  }
}
```

### Product JSON-LD schema

```typescript
// components/shop/product-schema.tsx
export function ProductSchema({ product, inStock }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images,
      brand: { '@type': 'Brand', name: product.brand || 'Luxe Collections' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'KES',
        price: product.selling_price,
        availability: inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: 'Luxe Collections Kenya' }
      }
    })}} />
  )
}
```

### Sitemap

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabase.from('public_products').select('slug, updated_at')
  const { data: categories } = await supabase.from('categories').select('slug, updated_at').eq('is_active', true)

  return [
    { url: 'https://shop.luxecollections.co.ke', changeFrequency: 'daily', priority: 1 },
    ...products.map(p => ({
      url: `https://shop.luxecollections.co.ke/products/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
    ...categories.map(c => ({
      url: `https://shop.luxecollections.co.ke/categories/${c.slug}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  ]
}
```

### robots.ts

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/account/', '/checkout/'],
    },
    sitemap: 'https://shop.luxecollections.co.ke/sitemap.xml',
  }
}
```

### ISR on-demand revalidation

When POS staff update a product, a Supabase webhook fires to bust the ISR cache immediately:

- Supabase Dashboard → Database Webhooks → `products` table UPDATE → POST to `https://shop.luxecollections.co.ke/api/revalidate`
- Route verifies `REVALIDATE_SECRET` header and calls `revalidatePath('/products/[slug]')`

### Image optimization

```typescript
// next.config.ts — do NOT set unoptimized: true (unlike the POS)
images: {
  remotePatterns: [{
    protocol: 'https',
    hostname: 'cqznlauqkconcrurqeaf.supabase.co',
    pathname: '/storage/v1/object/public/**',
  }],
}
```

Supabase Storage supports `?width=&quality=` transform parameters — use these in `<Image>` `src` to serve appropriately sized images.

---

## POS Change Required (minimal)

One addition to the existing POS repo: a **"Webshop Orders"** tab in the orders page.

```typescript
// Filter in the existing /orders page
const webshopOrders = orders.filter(o => o.source === 'webshop')
```

Show:
- Badge: `Online Order`
- Shipping address if `delivery_method = 'delivery'`
- Tracking number input field
- Status update: `processing → completed` triggers dispatch email automatically

---

## Deployment

### Vercel configuration

```json
// vercel.json
{
  "functions": {
    "app/api/mpesa/**": { "maxDuration": 30 },
    "app/api/orders/**": { "maxDuration": 15 }
  },
  "crons": [
    { "path": "/api/cart/abandon", "schedule": "0 * * * *" }
  ]
}
```

### Environment variables

```bash
# Supabase (same project)
NEXT_PUBLIC_SUPABASE_URL=https://cqznlauqkconcrurqeaf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=          # Anon key for browser client
SUPABASE_SERVICE_ROLE_KEY=              # Server-only: webhooks + order creation

# Algolia (same indexes — search-only key for client)
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=         # Search-only — safe to expose publicly
ALGOLIA_ADMIN_API_KEY=                  # Server-only

# M-Pesa
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://shop.luxecollections.co.ke/api/mpesa/callback
MPESA_ENV=production                    # Set to 'sandbox' in preview env

# Flutterwave
NEXT_PUBLIC_FLW_PUBLIC_KEY=
FLW_SECRET_KEY=
FLW_SECRET_HASH=

# Resend
RESEND_API_KEY=                         # Same key as POS

# Rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Security
CRON_SECRET=                            # Different from POS CRON_SECRET
REVALIDATE_SECRET=                      # For ISR on-demand revalidation
```

### Environments

| Environment | Supabase | M-Pesa | Domain |
|---|---|---|---|
| Production | Live project | `MPESA_ENV=production` | shop.luxecollections.co.ke |
| Preview (Vercel PRs) | Same project (read-heavy, safe) | `MPESA_ENV=sandbox` | *.vercel.app |
| Local dev | Same project | Sandbox + ngrok for callbacks | localhost:3000 |

---

## The 5 Riskiest Parts

### 1. Daraja Production Access (highest risk)

Getting a live Daraja account requires a registered Kenyan business, a Paybill or Till number, and Safaricom approval. **This process takes 1–4 weeks.** Start the application immediately in parallel with development.

**Mitigation:** Flutterwave supports M-Pesa Kenya natively through their own Daraja integration. If Safaricom approval is delayed, Flutterwave handles both card and M-Pesa — at slightly higher fees but zero additional integration work.

---

### 2. Inventory Race Conditions

The current POS `createOrder` does sequential checks without row-level locking — acceptable for one cashier at a till, but not for concurrent webshop traffic. If 10 customers try to buy the last unit simultaneously, all 10 pass the availability check.

**Mitigation:** Use the `reserve_inventory(FOR UPDATE)` Postgres function above. Reserve inventory when the order is created (status: `pending`). Decrement the actual quantity (remove reservation) only when payment is confirmed.

---

### 3. M-Pesa Callback Unreliability

Safaricom callbacks can arrive minutes late, be duplicated, or not arrive at all. The customer's browser polling will timeout after 90 seconds.

**Mitigation:**
- If polling times out: show *"We're confirming your payment…"* and send email confirmation once the callback eventually arrives
- Never tell the customer payment failed just because the callback hasn't arrived yet
- Use Daraja's **Transaction Status Query API** to manually check status if the callback hasn't arrived after 5 minutes
- Process all callbacks idempotently using a `UNIQUE` constraint on `payments.reference_number`

---

### 4. RLS Gaps Leaking POS Data

The POS never needed customer-facing RLS because everything goes through the service role or authenticated staff. Adding webshop customers (who are Supabase `authenticated` users) to the same project without RLS means they could query other users' orders.

**Mitigation:** Audit every table before Phase 5 (when customer accounts go live):
```sql
-- Check current policies
SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';
```
The `public_products` view + REVOKE on the base table is non-negotiable before launch.

---

### 5. Missing or Duplicate Product Slugs

The `products.slug` field exists in the POS but may be blank or duplicated for older records. This will crash `generateStaticParams` at build time.

**Mitigation:** Run the slug audit SQL in Phase 1 before writing any storefront code. Fix all duplicates and blanks in the POS first, then add the `UNIQUE` constraint to prevent recurrence.

---

## Timeline Summary

| Phase | Work | Estimated Time |
|---|---|---|
| **1** | Supabase migrations, views, RLS, slug audit | Weeks 1–2 |
| **2** | All storefront pages (homepage, listing, detail, category) with ISR | Week 3 |
| **3** | Cart (Zustand), checkout form, order creation API | Week 4 |
| **4** | M-Pesa STK Push + callback handler + order confirmation email | Week 5 |
| **5** | Customer accounts (Magic Link), order history, Flutterwave card | Weeks 6–8 |
| **6** | Email automation (dispatch, abandoned cart recovery, welcome) | Week 9 |
| **7** | SEO (JSON-LD, sitemap, robots), performance audit, Lighthouse ≥ 90 mobile | Weeks 10–12 |

**Total estimate: 10–12 weeks to production-ready.**

---

## Key Files in This Repo to Reference

| File | Why it's relevant |
|---|---|
| `lib/types.ts` | Copy as the base for webshop types; extend with `WebshopOrder`, `AbandonedCart` |
| `lib/actions/orders.ts` | The `createOrder` pattern is the direct model for the webshop order creation |
| `lib/supabase/middleware.ts` | Webshop middleware must invert this logic (public by default, gate only `/account/*`) |
| `lib/services/email.ts` | Resend integration pattern and `formatKES` are directly reusable |
| `supabase/migrations/` | Follow the same migration file structure and naming convention |
