-- The webshop security migration (20260421082335) revoked SELECT on products
-- from authenticated, which broke the mobile POS app -- it reads the products
-- table directly as the authenticated role ("Could not load product details").
-- Restore access, but scope the products table to staff so logged-in webshop
-- customers (also 'authenticated') still cannot see cost_price / supplier_id or
-- edit products. The webshop keeps using the public_products view.

-- Helper: is the current user a POS/admin staff member (present in user_profiles)?
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_profiles where id = auth.uid());
$$;

grant execute on function public.is_staff() to authenticated, anon;

-- Re-enable the table-level SELECT privilege for the POS apps.
grant select on products to authenticated;

-- Replace the broad policies (which allowed ANY authenticated user to read and
-- even edit/delete products) with staff-only policies.
drop policy if exists "Active products are viewable by everyone" on products;
drop policy if exists "Products are editable by authenticated users" on products;

create policy "Staff can read products"
  on products for select
  using (public.is_staff());

create policy "Staff can modify products"
  on products for all
  using (public.is_staff())
  with check (public.is_staff());
