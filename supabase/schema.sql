-- ============================================================
-- FastFood App - Supabase Schema
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ─── RESTAURANTS ─────────────────────────────────────────────────────────────
create table restaurants (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  name            text not null,
  description     text,
  logo_url        text,
  banner_url      text,
  address         text,
  phone           text,
  whatsapp_number text not null,
  hours_open      text,   -- "16:00"
  hours_close     text,   -- "00:00"
  is_open         boolean not null default false,
  primary_color   text not null default '#FBBF24',  -- amber-400
  nequi_number    text,
  nequi_qr_url    text,
  bank_account    text,
  payment_methods text[] not null default array['efectivo'],
  created_at      timestamptz not null default now()
);

-- ─── ADMIN USERS (link Supabase auth → restaurant) ───────────────────────────
create table admin_users (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique(user_id, restaurant_id)
);

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────
create table categories (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,
  "order"       integer not null default 0,
  is_active     boolean not null default true
);

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
create table products (
  id            uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id   uuid not null references categories(id) on delete cascade,
  name          text not null,
  description   text,
  price         integer not null,  -- en centavos colombianos (COP sin decimales)
  image_url     text,
  is_available  boolean not null default true,
  "order"       integer not null default 0
);

-- ─── ADDON GROUPS (por producto) ─────────────────────────────────────────────
create table addon_groups (
  id           uuid primary key default uuid_generate_v4(),
  product_id   uuid not null references products(id) on delete cascade,
  name         text not null,
  max_quantity integer not null default 1,
  is_required  boolean not null default false
);

-- ─── ADDON ITEMS ─────────────────────────────────────────────────────────────
create table addon_items (
  id             uuid primary key default uuid_generate_v4(),
  addon_group_id uuid not null references addon_groups(id) on delete cascade,
  name           text not null,
  price          integer not null default 0
);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
create table orders (
  id               uuid primary key default uuid_generate_v4(),
  restaurant_id    uuid not null references restaurants(id) on delete cascade,
  order_number     bigint not null,
  customer_name    text not null,
  customer_phone   text not null,
  customer_address text,
  delivery_type    text not null check (delivery_type in ('mesa','domicilio','recoger')),
  payment_method   text not null check (payment_method in ('efectivo','transferencia')),
  amount_tendered  integer,
  total            integer not null,
  notes            text,
  status           text not null default 'pendiente'
                   check (status in ('pendiente','preparando','listo','entregado')),
  created_at       timestamptz not null default now(),
  unique(restaurant_id, order_number)
);

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────
create table order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  product_name text not null,
  quantity     integer not null,
  unit_price   integer not null,
  notes        text
);

-- ─── ORDER ITEM ADDONS ───────────────────────────────────────────────────────
create table order_item_addons (
  id              uuid primary key default uuid_generate_v4(),
  order_item_id   uuid not null references order_items(id) on delete cascade,
  addon_item_id   uuid references addon_items(id) on delete set null,
  addon_name      text not null,
  price           integer not null,
  quantity        integer not null default 1
);

-- ─── SEQUENCE para order_number por restaurante ───────────────────────────────
create or replace function next_order_number(p_restaurant_id uuid)
returns bigint
language plpgsql
as $$
declare
  v_next bigint;
begin
  select coalesce(max(order_number), 10000000) + 1
    into v_next
    from orders
   where restaurant_id = p_restaurant_id;
  return v_next;
end;
$$;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

alter table restaurants     enable row level security;
alter table categories      enable row level security;
alter table products        enable row level security;
alter table addon_groups    enable row level security;
alter table addon_items     enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;
alter table order_item_addons enable row level security;
alter table admin_users     enable row level security;

-- Restaurants: public read, admin write
create policy "public_read_restaurants" on restaurants
  for select using (true);

create policy "admin_write_restaurants" on restaurants
  for all using (
    id in (
      select restaurant_id from admin_users where user_id = auth.uid()
    )
  );

-- Categories: public read, admin write
create policy "public_read_categories" on categories
  for select using (true);

create policy "admin_write_categories" on categories
  for all using (
    restaurant_id in (
      select restaurant_id from admin_users where user_id = auth.uid()
    )
  );

-- Products: public read, admin write
create policy "public_read_products" on products
  for select using (true);

create policy "admin_write_products" on products
  for all using (
    restaurant_id in (
      select restaurant_id from admin_users where user_id = auth.uid()
    )
  );

-- Addon groups: public read, admin write
create policy "public_read_addon_groups" on addon_groups
  for select using (true);

create policy "admin_write_addon_groups" on addon_groups
  for all using (
    product_id in (
      select p.id from products p
      join admin_users au on au.restaurant_id = p.restaurant_id
      where au.user_id = auth.uid()
    )
  );

-- Addon items: public read, admin write
create policy "public_read_addon_items" on addon_items
  for select using (true);

create policy "admin_write_addon_items" on addon_items
  for all using (
    addon_group_id in (
      select ag.id from addon_groups ag
      join products p on p.id = ag.product_id
      join admin_users au on au.restaurant_id = p.restaurant_id
      where au.user_id = auth.uid()
    )
  );

-- Orders: public insert (anyone can place order), admin read/write
create policy "public_insert_orders" on orders
  for insert with check (true);

create policy "admin_manage_orders" on orders
  for all using (
    restaurant_id in (
      select restaurant_id from admin_users where user_id = auth.uid()
    )
  );

-- Order items: public insert, admin read
create policy "public_insert_order_items" on order_items
  for insert with check (true);

create policy "admin_read_order_items" on order_items
  for select using (
    order_id in (
      select o.id from orders o
      join admin_users au on au.restaurant_id = o.restaurant_id
      where au.user_id = auth.uid()
    )
  );

-- Order item addons: public insert, admin read
create policy "public_insert_order_item_addons" on order_item_addons
  for insert with check (true);

create policy "admin_read_order_item_addons" on order_item_addons
  for select using (
    order_item_id in (
      select oi.id from order_items oi
      join orders o on o.id = oi.order_id
      join admin_users au on au.restaurant_id = o.restaurant_id
      where au.user_id = auth.uid()
    )
  );

-- Admin users: only own record
create policy "admin_users_own" on admin_users
  for all using (user_id = auth.uid());

-- ─── REALTIME para pedidos ────────────────────────────────────────────────────
alter publication supabase_realtime add table orders;

-- ─── ÍNDICES ─────────────────────────────────────────────────────────────────
create index idx_categories_restaurant on categories(restaurant_id, "order");
create index idx_products_category on products(category_id, "order");
create index idx_orders_restaurant_date on orders(restaurant_id, created_at desc);
create index idx_orders_status on orders(restaurant_id, status);

-- ─── DEMO DATA (opcional - ejecutar por separado) ─────────────────────────────
-- Ver archivo supabase/seed.sql
