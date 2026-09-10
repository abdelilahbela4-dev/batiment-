-- DESTPEC Bâtiment — Supabase migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- ============================================================
-- TABLES
-- ============================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  email text not null,
  telephone text not null,
  whatsapp text,
  canal_prefere text check (canal_prefere in ('email','whatsapp','telephone')) default 'email',
  adresse text,
  code_postal text,
  ville text,
  created_at timestamptz default now()
);

create table public.demandes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  type_travaux text[] not null,
  description text,
  budget_tranche text,
  delai text,
  photos text[] default '{}',
  statut text default 'Nouveau',
  created_at timestamptz default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  demande_id uuid references public.demandes(id) on delete set null,
  contenu text not null,
  created_at timestamptz default now()
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table public.prestations (
  id uuid primary key default gen_random_uuid(),
  designation text not null,
  type text,
  unite text,
  prix_ht numeric(10,2),
  tva_defaut numeric(4,2) default 20.00,
  created_at timestamptz default now()
);

create table public.devis (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  client_id uuid references public.clients(id) not null,
  demande_id uuid references public.demandes(id) on delete set null,
  date date default current_date,
  validite_jours integer default 30,
  statut text default 'brouillon' check (statut in ('brouillon', 'envoye', 'accepte', 'refuse')),
  lignes jsonb default '[]'::jsonb,
  totaux jsonb default '{}'::jsonb,
  company_snapshot jsonb,
  conditions text,
  created_at timestamptz default now()
);

create table public.factures (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  devis_id uuid references public.devis(id) on delete set null,
  client_id uuid references public.clients(id) not null,
  date date default current_date,
  statut text default 'emise' check (statut in ('emise', 'payee', 'partielle', 'impayee')),
  acompte numeric(10,2) default 0,
  lignes jsonb default '[]'::jsonb,
  totaux jsonb default '{}'::jsonb,
  company_snapshot jsonb,
  echeance date,
  created_at timestamptz default now()
);

-- ============================================================
-- AUTO-INCREMENT SEQUENCES for devis & facture numbering
-- ============================================================

create sequence public.devis_num_seq start 1;
create sequence public.factures_num_seq start 1;

-- Helper: generates "DEV-2026-001" style numbers
create or replace function public.next_devis_numero()
returns text as $$
  select 'DEV-' || extract(year from current_date)::text || '-' ||
         lpad(nextval('public.devis_num_seq')::text, 3, '0');
$$ language sql;

create or replace function public.next_facture_numero()
returns text as $$
  select 'FAC-' || extract(year from current_date)::text || '-' ||
         lpad(nextval('public.factures_num_seq')::text, 3, '0');
$$ language sql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.clients enable row level security;
alter table public.demandes enable row level security;
alter table public.notes enable row level security;
alter table public.settings enable row level security;
alter table public.prestations enable row level security;
alter table public.devis enable row level security;
alter table public.factures enable row level security;

-- ANON: insert-only on clients + demandes
create policy "anon_insert_clients" on public.clients
  for insert to anon with check (true);

create policy "anon_insert_demandes" on public.demandes
  for insert to anon with check (true);

-- AUTHENTICATED (admin): full access to everything
create policy "admin_all_clients" on public.clients
  for all to authenticated using (true) with check (true);

create policy "admin_all_demandes" on public.demandes
  for all to authenticated using (true) with check (true);

create policy "admin_all_notes" on public.notes
  for all to authenticated using (true) with check (true);

create policy "admin_all_settings" on public.settings
  for all to authenticated using (true) with check (true);

create policy "admin_all_prestations" on public.prestations
  for all to authenticated using (true) with check (true);

create policy "admin_all_devis" on public.devis
  for all to authenticated using (true) with check (true);

create policy "admin_all_factures" on public.factures
  for all to authenticated using (true) with check (true);

-- ============================================================
-- STORAGE: photos bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false);

-- Anon can upload to photos bucket
create policy "anon_upload_photos" on storage.objects
  for insert to anon with check (bucket_id = 'photos');

-- Anon can read photos they just uploaded (needed for URL generation)
create policy "anon_read_photos" on storage.objects
  for select to anon using (bucket_id = 'photos');

-- Admin full access to photos bucket
create policy "admin_all_photos" on storage.objects
  for all to authenticated using (bucket_id = 'photos') with check (bucket_id = 'photos');

-- ============================================================
-- SEED: insert a blank settings row
-- ============================================================

insert into public.settings (data) values ('{}');
