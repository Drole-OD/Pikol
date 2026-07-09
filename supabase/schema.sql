-- PickleBook schema for Supabase
-- Run this in the Supabase SQL editor after creating a new project.

-- =========================================================================
-- Tables
-- =========================================================================

create table if not exists public.courts (
  id                text primary key,
  name              text not null,
  address           text not null,
  lat               double precision not null,
  lng               double precision not null,
  phone             text not null,
  number_of_courts  int not null default 0,
  surface_type      text not null check (surface_type in ('indoor','outdoor','mixed')),
  amenities         text[] not null default '{}',
  operating_hours   jsonb not null,
  images            text[] not null default '{}',
  owner_id          uuid references auth.users(id) on delete set null
);

alter table public.courts add column if not exists images text[] not null default '{}';
alter table public.courts add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- Venues can now mix indoor and outdoor courts; surface_type is a computed
-- aggregate (see sync_number_of_courts below), so widen the allowed values.
alter table public.courts drop constraint if exists courts_surface_type_check;
alter table public.courts add constraint courts_surface_type_check
  check (surface_type in ('indoor','outdoor','mixed'));

-- Individual bookable courts within a venue (e.g. "Court 1", "Show Court").
-- Available time always follows the establishment's operating hours.
create table if not exists public.court_units (
  id                uuid primary key default gen_random_uuid(),
  court_id          text not null references public.courts(id) on delete cascade,
  number            int not null,
  name              text,
  is_active         boolean not null default true,
  surface_type      text check (surface_type in ('indoor','outdoor')),
  created_at        timestamptz not null default now(),
  unique (court_id, number)
);

alter table public.court_units add column if not exists surface_type text
  check (surface_type in ('indoor','outdoor'));
alter table public.court_units drop column if exists operating_hours;

-- Backfill any pre-existing units (created before per-court surface type
-- existed) with their venue's surface type, so every unit has a concrete value.
update public.court_units u
set surface_type = c.surface_type
from public.courts c
where u.court_id = c.id
  and u.surface_type is null
  and c.surface_type in ('indoor', 'outdoor');

-- Keep courts.number_of_courts and courts.surface_type in sync with their
-- court_units, so every existing consumer of those columns (search, badges,
-- slot capacity) stays correct without touching player-facing code.
create or replace function public.sync_number_of_courts() returns trigger as $$
declare
  v_court_id text := coalesce(new.court_id, old.court_id);
  v_types text[];
begin
  update public.courts
  set number_of_courts = (
    select count(*) from public.court_units
    where court_id = v_court_id and is_active = true
  )
  where id = v_court_id;

  select array_agg(distinct coalesce(surface_type, 'outdoor'))
  into v_types
  from public.court_units
  where court_id = v_court_id;

  update public.courts
  set surface_type = case
    when v_types is null then surface_type
    when array_length(v_types, 1) = 1 then v_types[1]
    else 'mixed'
  end
  where id = v_court_id;

  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists court_units_sync_count on public.court_units;
create trigger court_units_sync_count
  after insert or update or delete on public.court_units
  for each row execute function public.sync_number_of_courts();

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  role        text not null check (role in ('player','owner')),
  created_at  timestamptz not null default now()
);

create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  court_id      text not null references public.courts(id) on delete cascade,
  court_number  int not null,
  date          date not null,
  start_time    text not null,
  end_time      text not null,
  player_name   text not null,
  user_id       uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (court_id, court_number, date, start_time)
);

create index if not exists bookings_date_idx    on public.bookings (date);
create index if not exists bookings_user_id_idx on public.bookings (user_id);

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.courts      enable row level security;
alter table public.profiles    enable row level security;
alter table public.bookings    enable row level security;
alter table public.court_units enable row level security;

-- Courts: readable by anyone
drop policy if exists "courts read" on public.courts;
create policy "courts read" on public.courts
  for select using (true);

-- Courts: owners (role = 'owner') manage only their own venues
drop policy if exists "courts owner insert" on public.courts;
create policy "courts owner insert" on public.courts
  for insert with check (
    auth.uid() = owner_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
  );

drop policy if exists "courts owner update" on public.courts;
create policy "courts owner update" on public.courts
  for update using (auth.uid() = owner_id);

drop policy if exists "courts owner delete" on public.courts;
create policy "courts owner delete" on public.courts
  for delete using (auth.uid() = owner_id);

-- Court units: readable by anyone (players need names/availability)
drop policy if exists "court_units read" on public.court_units;
create policy "court_units read" on public.court_units
  for select using (true);

-- Court units: only the owning venue's owner can manage them
drop policy if exists "court_units owner insert" on public.court_units;
create policy "court_units owner insert" on public.court_units
  for insert with check (
    exists (select 1 from public.courts c where c.id = court_id and c.owner_id = auth.uid())
  );

drop policy if exists "court_units owner update" on public.court_units;
create policy "court_units owner update" on public.court_units
  for update using (
    exists (select 1 from public.courts c where c.id = court_id and c.owner_id = auth.uid())
  );

drop policy if exists "court_units owner delete" on public.court_units;
create policy "court_units owner delete" on public.court_units
  for delete using (
    exists (select 1 from public.courts c where c.id = court_id and c.owner_id = auth.uid())
  );

-- Profiles: user reads / writes only their own row
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

-- Bookings: readable by anyone (needed for availability display)
drop policy if exists "bookings read" on public.bookings;
create policy "bookings read" on public.bookings
  for select using (true);

-- Bookings: authenticated users create rows tied to themselves
drop policy if exists "bookings insert own" on public.bookings;
create policy "bookings insert own" on public.bookings
  for insert with check (auth.uid() = user_id);

-- Bookings: users can delete their own
drop policy if exists "bookings delete own" on public.bookings;
create policy "bookings delete own" on public.bookings
  for delete using (auth.uid() = user_id);

-- =========================================================================
-- No demo seed data — the app is scoped to the Philippines. Court owners
-- add their own venues through the Owner Dashboard.
-- =========================================================================

-- =========================================================================
-- Storage: court photos
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('court-images', 'court-images', true)
on conflict (id) do nothing;

drop policy if exists "court images public read" on storage.objects;
create policy "court images public read" on storage.objects
  for select using (bucket_id = 'court-images');

drop policy if exists "court images owner insert" on storage.objects;
create policy "court images owner insert" on storage.objects
  for insert with check (bucket_id = 'court-images' and auth.role() = 'authenticated');

drop policy if exists "court images owner update" on storage.objects;
create policy "court images owner update" on storage.objects
  for update using (bucket_id = 'court-images' and auth.role() = 'authenticated');

drop policy if exists "court images owner delete" on storage.objects;
create policy "court images owner delete" on storage.objects
  for delete using (bucket_id = 'court-images' and auth.role() = 'authenticated');
