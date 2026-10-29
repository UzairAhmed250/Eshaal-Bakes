-- =============================================================================
-- Eshaal Bakes — Initial Schema, RLS Policies, Triggers, RPCs & Storage Buckets
-- Currency: Integer PKR | Timezone: Asia/Karachi
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PROFILES (with role)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'customer' check (role in ('admin', 'staff', 'customer')),
  mfa_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper function to verify admin role in RLS policies
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. STORE SETTINGS (Single store per deployment)
-- -----------------------------------------------------------------------------
create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default 'Eshaal Bakes',
  tagline text not null default 'Artisan Custom Cakes & Small-Batch Bakes in Karachi',
  logo_url text not null default '/logo.svg',
  whatsapp_number text not null default '923001234567',
  delivery_fee_pkr integer not null default 350 check (delivery_fee_pkr >= 0),
  delivery_areas jsonb not null default '["Korangi", "Landhi", "Malir / Model Colony", "Shah Faisal Colony", "PECHS / Tariq Road", "Defence (DHA)", "Clifton", "Gulshan-e-Iqbal", "Gulistan-e-Jauhar", "North Nazimabad"]'::jsonb,
  is_open boolean not null default true,
  announcement_banner text not null default 'Fresh Eid & Birthday slots open in Korangi, Karachi! Same-day delivery across Karachi for orders placed before 1:00 PM.',
  payment_instructions text not null default 'Easypaisa / JazzCash: 0300-1234567 (Eshaal Fatima) | Meezan Bank IBAN: PK36MEZN0001234567890102. Share screenshot on WhatsApp with your Order Code.',
  min_lead_time_hours integer not null default 5 check (min_lead_time_hours >= 1),
  sameday_cutoff_time text not null default '13:00',
  default_advance_percent integer not null default 50 check (default_advance_percent between 0 and 100),
  cod_advance_threshold_pkr integer not null default 5000 check (cod_advance_threshold_pkr >= 0),
  quote_validity_hours integer not null default 24 check (quote_validity_hours >= 1),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. CATEGORIES
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. FLAVOURS (Admin-managed cake flavours for custom orders)
-- -----------------------------------------------------------------------------
create table if not exists public.flavours (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  price_modifier_pkr integer not null default 0 check (price_modifier_pkr >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 5. PRODUCTS
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price_pkr integer not null check (price_pkr >= 0),
  compare_at_price_pkr integer check (compare_at_price_pkr is null or compare_at_price_pkr >= price_pkr),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  track_inventory boolean not null default true,
  allow_custom_text boolean not null default false,
  is_active boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 6. PRODUCT IMAGES
-- -----------------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 7. PRODUCT OPTIONS / VARIANTS
-- -----------------------------------------------------------------------------
create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  choices jsonb not null default '[]'::jsonb,
  required boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 8. ORDERS
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  tracking_token text not null unique,
  idempotency_key text not null unique,
  order_type text not null check (order_type in ('fixed', 'custom')),
  status text not null check (
    (order_type = 'fixed' and status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'))
    or
    (order_type = 'custom' and status in ('quote_requested', 'quoted', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'declined', 'expired'))
  ),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'advance_paid', 'paid')),
  payment_method text not null default 'cod' check (payment_method in ('cod', 'manual_transfer')),
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  delivery_area text not null,
  delivery_date date not null,
  delivery_slot text not null,
  customer_notes text not null default '',
  internal_notes text not null default '',
  cancellation_reason text not null default '',
  subtotal_pkr integer not null default 0 check (subtotal_pkr >= 0),
  delivery_fee_pkr integer not null default 0 check (delivery_fee_pkr >= 0),
  advance_required_pkr integer not null default 0 check (advance_required_pkr >= 0),
  total_pkr integer not null default 0 check (total_pkr >= 0),
  is_first_time_customer boolean not null default true,
  needs_confirmation boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_code on public.orders(order_code);
create index if not exists idx_orders_tracking_token on public.orders(tracking_token);
create index if not exists idx_orders_customer_phone on public.orders(customer_phone);
create index if not exists idx_orders_delivery_date on public.orders(delivery_date);

-- -----------------------------------------------------------------------------
-- 9. ORDER ITEMS (Price & variant snapshot at time of order)
-- -----------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  variant_label_snapshot text not null default '',
  unit_price_pkr integer not null check (unit_price_pkr >= 0),
  quantity integer not null check (quantity >= 1),
  custom_text text not null default '',
  line_total_pkr integer not null check (line_total_pkr >= 0),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 10. CUSTOM ORDER DETAILS
-- -----------------------------------------------------------------------------
create table if not exists public.custom_order_details (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  flavour_id uuid references public.flavours(id) on delete set null,
  flavour_name_snapshot text not null,
  weight_label text not null,
  design_description text not null,
  theme_text text not null default '',
  same_day_eligible boolean not null default false,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 11. QUOTES (Immutable once approved; revisions create new version)
-- -----------------------------------------------------------------------------
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  version integer not null default 1 check (version >= 1),
  quote_token text not null unique,
  price_pkr integer not null check (price_pkr > 0),
  delivery_fee_pkr integer not null default 0 check (delivery_fee_pkr >= 0),
  total_pkr integer not null check (total_pkr > 0),
  advance_pkr integer not null default 0 check (advance_pkr >= 0 and advance_pkr <= total_pkr),
  notes text not null default '',
  valid_until timestamptz not null,
  status text not null default 'sent' check (status in ('sent', 'approved', 'declined', 'superseded', 'expired')),
  approved_at timestamptz,
  declined_at timestamptz,
  is_immutable boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (order_id, version)
);

-- Trigger: prevent mutation of approved/immutable quote fields
create or replace function public.enforce_quote_immutability()
returns trigger
language plpgsql
as $$
begin
  if old.is_immutable = true or old.status = 'approved' then
    if new.price_pkr <> old.price_pkr
       or new.delivery_fee_pkr <> old.delivery_fee_pkr
       or new.total_pkr <> old.total_pkr
       or new.advance_pkr <> old.advance_pkr
       or new.quote_token <> old.quote_token then
      raise exception 'Approved quotes are immutable. Create a new quote version instead.';
    end if;
  end if;
  if new.status = 'approved' then
    new.is_immutable := true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_quote_immutability on public.quotes;
create trigger trg_enforce_quote_immutability
before update on public.quotes
for each row execute function public.enforce_quote_immutability();

-- -----------------------------------------------------------------------------
-- 12. REFERENCE IMAGES (Private bucket metadata)
-- -----------------------------------------------------------------------------
create table if not exists public.reference_images (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  storage_path text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 13. ORDER STATUS HISTORY
-- -----------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text not null default '',
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 14. AUDIT LOG (PII-free admin action log)
-- -----------------------------------------------------------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- ATOMIC STOCK DECREMENT RPC (Prevents overselling)
-- -----------------------------------------------------------------------------
create or replace function public.decrement_product_stock(
  p_product_id uuid,
  p_quantity integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_track boolean;
  v_stock integer;
begin
  select track_inventory, stock_quantity
  into v_track, v_stock
  from public.products
  where id = p_product_id
    and is_active = true
    and is_deleted = false
  for update;

  if not found then
    return false;
  end if;

  if v_track = false or v_stock is null then
    return true;
  end if;

  if v_stock < p_quantity then
    return false;
  end if;

  update public.products
  set stock_quantity = stock_quantity - p_quantity,
      updated_at = now()
  where id = p_product_id;

  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) ON EVERY TABLE
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.store_settings enable row level security;
alter table public.categories enable row level security;
alter table public.flavours enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_options enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.custom_order_details enable row level security;
alter table public.quotes enable row level security;
alter table public.reference_images enable row level security;
alter table public.order_status_history enable row level security;
alter table public.audit_log enable row level security;

-- Public read-only policies ONLY for active storefront entities:
create policy "Public can read store_settings"
  on public.store_settings for select
  to anon, authenticated
  using (true);

create policy "Public can read active categories"
  on public.categories for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "Public can read active flavours"
  on public.flavours for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "Public can read active non-deleted products"
  on public.products for select
  to anon, authenticated
  using ((is_active = true and is_deleted = false) or public.is_admin());

create policy "Public can read product_images of active products"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and ((p.is_active = true and p.is_deleted = false) or public.is_admin())
    )
  );

create policy "Public can read product_options of active products"
  on public.product_options for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_options.product_id
        and ((p.is_active = true and p.is_deleted = false) or public.is_admin())
    )
  );

-- Profiles: users can read own profile; admins can read/write all
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "Admins manage profiles"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admin full policies on all tables (Public has ZERO direct access to orders, quotes, reference_images, etc.)
create policy "Admins manage store_settings"
  on public.store_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage categories"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage flavours"
  on public.flavours for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage products"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage product_images"
  on public.product_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage product_options"
  on public.product_options for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins only on orders"
  on public.orders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins only on order_items"
  on public.order_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins only on custom_order_details"
  on public.custom_order_details for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins only on quotes"
  on public.quotes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins only on reference_images"
  on public.reference_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins only on order_status_history"
  on public.order_status_history for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins only on audit_log"
  on public.audit_log for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- STORAGE BUCKETS & POLICIES
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('reference-images', 'reference-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Public can read product-images bucket"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

create policy "Admins can write product-images bucket"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admins only can read/write reference-images bucket"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'reference-images' and public.is_admin())
  with check (bucket_id = 'reference-images' and public.is_admin());
