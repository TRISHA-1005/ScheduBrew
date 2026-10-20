-- ScheduBrew initial PostgreSQL schema
-- Apply this migration in Supabase SQL Editor or through the Supabase CLI.
-- Customer and business-owner account types are limited to these two values.
-- Do not store passwords in public tables. Supabase Auth owns credentials.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null default 'customer'
    check (account_type in ('customer', 'business_owner')),
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (length(btrim(name)) between 2 and 100),
  description text not null default '',
  phone text,
  address text not null default '',
  city text,
  province text,
  postal_code text,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists businesses_owner_id_idx on public.businesses(owner_id);
create index if not exists businesses_status_idx on public.businesses(status);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_closed boolean not null default false,
  opens_at time not null default time '07:00',
  closes_at time not null default time '20:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, day_of_week),
  check (is_closed or opens_at < closes_at)
);

create table if not exists public.business_notification_preferences (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  order_updates boolean not null default true,
  pickup_reminders boolean not null default true,
  low_capacity_alerts boolean not null default true,
  loyalty_activity boolean not null default true,
  weekly_summary boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.business_subscriptions (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  plan_key text not null default 'starter' check (plan_key in ('starter', 'growth', 'pro')),
  status text not null default 'not_connected'
    check (status in ('not_connected', 'trial', 'active', 'past_due', 'cancelled')),
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name),
  unique (id, business_id)
);
create index if not exists menu_categories_business_id_idx on public.menu_categories(business_id);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid,
  name text not null check (length(btrim(name)) between 1 and 120),
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  prep_minutes integer not null default 10 check (prep_minutes between 0 and 240),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  track_stock boolean not null default false,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, business_id)
    references public.menu_categories(id, business_id) on delete set null (category_id)
);
create index if not exists menu_items_business_id_idx on public.menu_items(business_id);
create index if not exists menu_items_category_id_idx on public.menu_items(category_id);

create table if not exists public.pickup_slots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null default 10 check (capacity > 0),
  reserved_count integer not null default 0 check (reserved_count >= 0 and reserved_count <= capacity),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (business_id, starts_at)
);
create index if not exists pickup_slots_business_time_idx on public.pickup_slots(business_id, starts_at);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated by default as identity unique,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  pickup_slot_id uuid not null references public.pickup_slots(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  total numeric(12,2) not null check (total >= 0),
  pickup_at timestamptz not null,
  customer_note text check (customer_note is null or length(customer_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_customer_created_idx on public.orders(customer_id, created_at desc);
create index if not exists orders_business_status_created_idx on public.orders(business_id, status, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 30),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  unique (order_id, menu_item_id)
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

create table if not exists public.loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  points_balance integer not null default 0 check (points_balance >= 0),
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, customer_id)
);
create index if not exists loyalty_accounts_customer_idx on public.loyalty_accounts(customer_id);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  points_delta integer not null check (points_delta <> 0),
  reason text not null check (length(btrim(reason)) between 1 and 200),
  created_at timestamptz not null default now()
);
create index if not exists loyalty_transactions_customer_idx on public.loyalty_transactions(customer_id, created_at desc);
create index if not exists loyalty_transactions_business_idx on public.loyalty_transactions(business_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.current_account_type()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.account_type from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.is_business_owner_of(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = p_business_id
      and b.owner_id = auth.uid()
      and public.current_account_type() = 'business_owner'
  )
$$;

revoke all on function public.current_account_type() from public, anon;
revoke all on function public.is_business_owner_of(uuid) from public, anon;
grant execute on function public.current_account_type() to authenticated;
grant execute on function public.is_business_owner_of(uuid) to authenticated;

create or replace function public.seed_business_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.business_hours (business_id, day_of_week, is_closed, opens_at, closes_at)
  select new.id, d.day_num,
         (d.day_num = 0 or d.day_num = 6),
         case when d.day_num = 0 or d.day_num = 6 then time '08:00' else time '07:00' end,
         case when d.day_num = 0 or d.day_num = 6 then time '18:00' else time '20:00' end
  from generate_series(0, 6) as d(day_num)
  on conflict (business_id, day_of_week) do nothing;

  insert into public.business_notification_preferences (business_id)
  values (new.id) on conflict (business_id) do nothing;

  insert into public.business_subscriptions (business_id)
  values (new.id) on conflict (business_id) do nothing;

  return new;
end;
$$;

drop trigger if exists business_seed_defaults on public.businesses;
create trigger business_seed_defaults
after insert on public.businesses
for each row execute function public.seed_business_defaults();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account_type text;
  v_full_name text;
  v_phone text;
  v_shop_name text;
  v_business_address text;
begin
  v_account_type := coalesce(new.raw_user_meta_data ->> 'account_type', new.raw_user_meta_data ->> 'role', 'customer');
  if v_account_type in ('business', 'business_owner') then
    v_account_type := 'business_owner';
  elsif v_account_type <> 'customer' then
    v_account_type := 'customer';
  end if;

  v_full_name := left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120);
  v_phone := nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'phone', '')), 32), '');
  v_shop_name := nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'shop_name', '')), 100), '');
  v_business_address := nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'business_address', '')), 240), '');

  if v_account_type = 'business_owner' and (v_shop_name is null or v_business_address is null) then
    raise exception 'Business owner registration requires a business name and address.';
  end if;

  insert into public.profiles (id, account_type, full_name, phone)
  values (new.id, v_account_type, v_full_name, v_phone)
  on conflict (id) do nothing;

  if v_account_type = 'business_owner' then
    insert into public.businesses (owner_id, name, address, phone, status)
    values (new.id, v_shop_name, v_business_address, v_phone, 'pending_review');
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Backfill existing Supabase Auth users from the account metadata used by the earlier signup form.
-- Metadata is used only during this one-time migration. RLS and application authorization use profiles.account_type.
insert into public.profiles (id, account_type, full_name, phone)
select
  u.id,
  case
    when coalesce(u.raw_user_meta_data ->> 'account_type', u.raw_user_meta_data ->> 'role') in ('business', 'business_owner') then 'business_owner'
    else 'customer'
  end,
  left(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), 120),
  nullif(left(btrim(coalesce(u.raw_user_meta_data ->> 'phone', '')), 32), '')
from auth.users u
on conflict (id) do nothing;

insert into public.businesses (owner_id, name, address, phone, status)
select p.id,
       left(btrim(u.raw_user_meta_data ->> 'shop_name'), 100),
       left(btrim(coalesce(u.raw_user_meta_data ->> 'business_address', '')), 240),
       p.phone,
       'pending_review'
from public.profiles p
join auth.users u on u.id = p.id
where p.account_type = 'business_owner'
  and nullif(btrim(u.raw_user_meta_data ->> 'shop_name'), '') is not null
  and not exists (select 1 from public.businesses b where b.owner_id = p.id);

-- Keep updated_at consistent for mutable records.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'businesses', 'business_hours', 'business_notification_preferences',
    'business_subscriptions', 'menu_categories', 'menu_items', 'pickup_slots',
    'orders', 'loyalty_accounts'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

create or replace function public.enforce_order_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = new.status then
    return new;
  end if;

  if (old.status = 'pending' and new.status in ('confirmed', 'cancelled'))
     or (old.status = 'confirmed' and new.status in ('preparing', 'cancelled'))
     or (old.status = 'preparing' and new.status in ('ready', 'cancelled'))
     or (old.status = 'ready' and new.status in ('completed', 'cancelled')) then
    return new;
  end if;

  raise exception 'Invalid order status transition from % to %.', old.status, new.status
    using errcode = '22023';
end;
$$;

drop trigger if exists enforce_order_status_transition on public.orders;
create trigger enforce_order_status_transition
before update of status on public.orders
for each row execute function public.enforce_order_status_transition();

create or replace function public.release_cancelled_pickup_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then
    update public.pickup_slots
    set reserved_count = greatest(0, reserved_count - 1)
    where id = new.pickup_slot_id;
  end if;
  return new;
end;
$$;

drop trigger if exists release_cancelled_pickup_capacity on public.orders;
create trigger release_cancelled_pickup_capacity
after update of status on public.orders
for each row execute function public.release_cancelled_pickup_capacity();

-- Order creation is performed through this function so clients cannot forge prices,
-- totals, business ownership, or pickup capacity.
create or replace function public.place_order(
  p_business_id uuid,
  p_pickup_slot_id uuid,
  p_items jsonb,
  p_customer_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
  v_slot public.pickup_slots%rowtype;
  v_item public.menu_items%rowtype;
  v_line record;
  v_total numeric(12,2) := 0;
  v_order_id uuid;
  v_role text;
begin
  if v_customer_id is null then
    raise exception 'You must sign in before placing an order.' using errcode = '28000';
  end if;

  select p.account_type into v_role from public.profiles p where p.id = v_customer_id;
  if v_role is distinct from 'customer' then
    raise exception 'Only customer accounts can place orders.' using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Order items must be provided as a JSON array.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'An order must contain between 1 and 50 item lines.' using errcode = '22023';
  end if;
  if p_customer_note is not null and length(p_customer_note) > 500 then
    raise exception 'The order note must be 500 characters or fewer.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.status = 'active'
  ) then
    raise exception 'This business is not currently accepting orders.' using errcode = '22023';
  end if;

  select ps.* into v_slot
  from public.pickup_slots ps
  where ps.id = p_pickup_slot_id
    and ps.business_id = p_business_id
    and ps.is_active = true
    and ps.starts_at > now()
    and ps.reserved_count < ps.capacity
  for update;
  if not found then
    raise exception 'The selected pickup slot is unavailable.' using errcode = '22023';
  end if;

  -- Aggregate duplicate product ids and validate each item against the selected business.
  for v_line in
    select x.menu_item_id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(menu_item_id uuid, quantity integer)
    group by x.menu_item_id
  loop
    if v_line.menu_item_id is null or v_line.quantity is null
       or v_line.quantity < 1 or v_line.quantity > 30 then
      raise exception 'Each menu item quantity must be between 1 and 30.' using errcode = '22023';
    end if;

    select mi.* into v_item
    from public.menu_items mi
    where mi.id = v_line.menu_item_id
      and mi.business_id = p_business_id
      and mi.is_available = true
    for update;
    if not found then
      raise exception 'One or more menu items are unavailable.' using errcode = '22023';
    end if;
    if v_item.track_stock and v_item.stock < v_line.quantity then
      raise exception 'There is not enough stock for %.', v_item.name using errcode = '22023';
    end if;
    v_total := v_total + (v_item.price * v_line.quantity);
  end loop;

  insert into public.orders (
    customer_id, business_id, pickup_slot_id, status, total, pickup_at, customer_note
  ) values (
    v_customer_id, p_business_id, p_pickup_slot_id, 'pending', v_total,
    v_slot.starts_at, nullif(btrim(coalesce(p_customer_note, '')), '')
  ) returning id into v_order_id;

  for v_line in
    select x.menu_item_id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(menu_item_id uuid, quantity integer)
    group by x.menu_item_id
  loop
    select mi.* into v_item from public.menu_items mi where mi.id = v_line.menu_item_id;
    insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total)
    values (v_order_id, v_item.id, v_item.name, v_item.price, v_line.quantity, v_item.price * v_line.quantity);

    if v_item.track_stock then
      update public.menu_items set stock = stock - v_line.quantity where id = v_item.id;
    end if;
  end loop;

  update public.pickup_slots set reserved_count = reserved_count + 1 where id = p_pickup_slot_id;
  insert into public.loyalty_accounts (business_id, customer_id)
  values (p_business_id, v_customer_id)
  on conflict (business_id, customer_id) do nothing;

  return v_order_id;
end;
$$;

revoke all on function public.place_order(uuid, uuid, jsonb, text) from public, anon;
grant execute on function public.place_order(uuid, uuid, jsonb, text) to authenticated;

-- Enable Row Level Security everywhere the browser can reach.
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_hours enable row level security;
alter table public.business_notification_preferences enable row level security;
alter table public.business_subscriptions enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.pickup_slots enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_transactions enable row level security;

-- Remove any existing policies with these names so this migration is repeatable.
drop policy if exists profiles_select_allowed on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_business_customer_read on public.profiles;
drop policy if exists businesses_select_visible on public.businesses;
drop policy if exists businesses_update_owner on public.businesses;
drop policy if exists business_hours_select_visible on public.business_hours;
drop policy if exists business_hours_owner_insert on public.business_hours;
drop policy if exists business_hours_owner_update on public.business_hours;
drop policy if exists business_hours_owner_delete on public.business_hours;
drop policy if exists business_notifications_owner_select on public.business_notification_preferences;
drop policy if exists business_notifications_owner_update on public.business_notification_preferences;
drop policy if exists subscriptions_owner_select on public.business_subscriptions;
drop policy if exists menu_categories_select_visible on public.menu_categories;
drop policy if exists menu_categories_owner_insert on public.menu_categories;
drop policy if exists menu_categories_owner_update on public.menu_categories;
drop policy if exists menu_categories_owner_delete on public.menu_categories;
drop policy if exists menu_items_select_visible on public.menu_items;
drop policy if exists menu_items_owner_insert on public.menu_items;
drop policy if exists menu_items_owner_update on public.menu_items;
drop policy if exists menu_items_owner_delete on public.menu_items;
drop policy if exists pickup_slots_select_visible on public.pickup_slots;
drop policy if exists pickup_slots_owner_insert on public.pickup_slots;
drop policy if exists pickup_slots_owner_update on public.pickup_slots;
drop policy if exists pickup_slots_owner_delete on public.pickup_slots;
drop policy if exists orders_select_customer_or_owner on public.orders;
drop policy if exists orders_owner_update_status on public.orders;
drop policy if exists order_items_select_customer_or_owner on public.order_items;
drop policy if exists loyalty_accounts_select_customer_or_owner on public.loyalty_accounts;
drop policy if exists loyalty_transactions_select_customer_or_owner on public.loyalty_transactions;

create policy profiles_select_allowed on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.orders o
    where o.customer_id = profiles.id
      and public.is_business_owner_of(o.business_id)
  )
);
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy businesses_select_visible on public.businesses
for select to authenticated
using (
  owner_id = auth.uid()
  or (status = 'active' and public.current_account_type() = 'customer')
);
create policy businesses_update_owner on public.businesses
for update to authenticated
using (owner_id = auth.uid() and public.current_account_type() = 'business_owner')
with check (owner_id = auth.uid() and public.current_account_type() = 'business_owner');

create policy business_hours_select_visible on public.business_hours
for select to authenticated
using (
  public.is_business_owner_of(business_id)
  or exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active' and public.current_account_type() = 'customer')
);
create policy business_hours_owner_insert on public.business_hours
for insert to authenticated with check (public.is_business_owner_of(business_id));
create policy business_hours_owner_update on public.business_hours
for update to authenticated using (public.is_business_owner_of(business_id)) with check (public.is_business_owner_of(business_id));
create policy business_hours_owner_delete on public.business_hours
for delete to authenticated using (public.is_business_owner_of(business_id));

create policy business_notifications_owner_select on public.business_notification_preferences
for select to authenticated using (public.is_business_owner_of(business_id));
create policy business_notifications_owner_update on public.business_notification_preferences
for update to authenticated using (public.is_business_owner_of(business_id)) with check (public.is_business_owner_of(business_id));
create policy subscriptions_owner_select on public.business_subscriptions
for select to authenticated using (public.is_business_owner_of(business_id));

create policy menu_categories_select_visible on public.menu_categories
for select to authenticated
using (
  public.is_business_owner_of(business_id)
  or exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active' and public.current_account_type() = 'customer')
);
create policy menu_categories_owner_insert on public.menu_categories
for insert to authenticated with check (public.is_business_owner_of(business_id));
create policy menu_categories_owner_update on public.menu_categories
for update to authenticated using (public.is_business_owner_of(business_id)) with check (public.is_business_owner_of(business_id));
create policy menu_categories_owner_delete on public.menu_categories
for delete to authenticated using (public.is_business_owner_of(business_id));

create policy menu_items_select_visible on public.menu_items
for select to authenticated
using (
  public.is_business_owner_of(business_id)
  or (is_available and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active' and public.current_account_type() = 'customer'))
);
create policy menu_items_owner_insert on public.menu_items
for insert to authenticated with check (public.is_business_owner_of(business_id));
create policy menu_items_owner_update on public.menu_items
for update to authenticated using (public.is_business_owner_of(business_id)) with check (public.is_business_owner_of(business_id));
create policy menu_items_owner_delete on public.menu_items
for delete to authenticated using (public.is_business_owner_of(business_id));

create policy pickup_slots_select_visible on public.pickup_slots
for select to authenticated
using (
  public.is_business_owner_of(business_id)
  or (is_active and starts_at > now() and reserved_count < capacity
      and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'active' and public.current_account_type() = 'customer'))
);
create policy pickup_slots_owner_insert on public.pickup_slots
for insert to authenticated with check (public.is_business_owner_of(business_id));
create policy pickup_slots_owner_update on public.pickup_slots
for update to authenticated using (public.is_business_owner_of(business_id)) with check (public.is_business_owner_of(business_id));
create policy pickup_slots_owner_delete on public.pickup_slots
for delete to authenticated using (public.is_business_owner_of(business_id));

create policy orders_select_customer_or_owner on public.orders
for select to authenticated
using (customer_id = auth.uid() or public.is_business_owner_of(business_id));
create policy orders_owner_update_status on public.orders
for update to authenticated using (public.is_business_owner_of(business_id)) with check (public.is_business_owner_of(business_id));
create policy order_items_select_customer_or_owner on public.order_items
for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.customer_id = auth.uid() or public.is_business_owner_of(o.business_id))
  )
);

create policy loyalty_accounts_select_customer_or_owner on public.loyalty_accounts
for select to authenticated
using (customer_id = auth.uid() or public.is_business_owner_of(business_id));
create policy loyalty_transactions_select_customer_or_owner on public.loyalty_transactions
for select to authenticated
using (customer_id = auth.uid() or public.is_business_owner_of(business_id));

-- Explicit grants are part of the security boundary; RLS alone is not enough.
revoke all on public.profiles, public.businesses, public.business_hours,
  public.business_notification_preferences, public.business_subscriptions,
  public.menu_categories, public.menu_items, public.pickup_slots,
  public.orders, public.order_items, public.loyalty_accounts,
  public.loyalty_transactions from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

grant select (id, name, description, phone, address, city, province, postal_code, status, created_at, updated_at)
  on public.businesses to authenticated;
grant update (name, description, phone, address, city, province, postal_code)
  on public.businesses to authenticated;

grant select, insert, update, delete on public.business_hours to authenticated;
grant select, update (order_updates, pickup_reminders, low_capacity_alerts, loyalty_activity, weekly_summary)
  on public.business_notification_preferences to authenticated;
grant select on public.business_subscriptions to authenticated;
grant select, insert, update, delete on public.menu_categories to authenticated;
grant select, insert, update, delete on public.menu_items to authenticated;
grant select on public.pickup_slots to authenticated;
grant insert (business_id, starts_at, ends_at, capacity, is_active) on public.pickup_slots to authenticated;
grant update (starts_at, ends_at, capacity, is_active) on public.pickup_slots to authenticated;
grant delete on public.pickup_slots to authenticated;
grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated;
grant select on public.order_items, public.loyalty_accounts, public.loyalty_transactions to authenticated;

commit;
