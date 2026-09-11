-- AM Construction — Sécurité : administration réservée, photos privées
-- ---------------------------------------------------------------------------
-- À exécuter UNE FOIS dans Supabase > SQL Editor > New query.
--
-- AVANT DE LANCER : remplacez VOTRE_EMAIL_ADMIN (ligne 27) par l'email exact
-- avec lequel vous vous connectez à l'admin (visible dans Authentication > Users).
-- Si cet email n'existe pas, le script s'arrête et RIEN n'est modifié.
--
-- Ce que fait le script :
--   1. Crée la liste des administrateurs (public.admins) et y ajoute votre compte.
--   2. Crée la fonction public.is_admin().
--   3. Remplace les règles « tout utilisateur connecté = accès total » par
--      « administrateur uniquement » sur les tables de l'admin.
--      Le formulaire du site (insertion anonyme) continue de fonctionner.
--   4. Photos : supprime la lecture publique, limite les envois aux images de 8 Mo.
-- ---------------------------------------------------------------------------

begin;

-- 1. Liste des administrateurs ----------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

do $$
declare
  admin_email constant text := 'VOTRE_EMAIL_ADMIN';
begin
  insert into public.admins (user_id, email)
  select id, email from auth.users where lower(email) = lower(admin_email)
  on conflict (user_id) do nothing;

  if not exists (
    select 1 from public.admins a
    join auth.users u on u.id = a.user_id
    where lower(u.email) = lower(admin_email)
  ) then
    raise exception 'Aucun compte "%" dans Authentication > Users : rien n''a été modifié.', admin_email;
  end if;
end $$;

-- 2. Fonction de contrôle -----------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 3. Tables de l'admin : administrateur uniquement ---------------------------
do $$
declare
  t text;
  p record;
begin
  foreach t in array array['clients', 'demandes', 'notes', 'settings', 'prestations', 'devis', 'factures'] loop
    if to_regclass('public.' || t) is null then
      raise notice 'Table public.% absente : ignorée.', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    -- Retire toute règle visant les utilisateurs connectés, ainsi que les règles
    -- « public » autres que l'insertion (celle du formulaire du site est conservée).
    for p in
      select policyname, cmd, roles from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      if 'authenticated'::name = any (p.roles)
         or ('public'::name = any (p.roles) and p.cmd <> 'INSERT') then
        execute format('drop policy %I on public.%I', p.policyname, t);
      end if;
    end loop;

    execute format(
      'create policy %I on public.%I for all to authenticated '
      'using ((select public.is_admin())) with check ((select public.is_admin()))',
      'admin_only_' || t, t
    );
  end loop;

  -- Le formulaire du site doit toujours pouvoir créer un client et une demande.
  if to_regclass('public.clients') is not null and not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'clients' and cmd = 'INSERT'
      and ('anon'::name = any (roles) or 'public'::name = any (roles))
  ) then
    create policy anon_insert_clients on public.clients for insert to anon with check (true);
  end if;

  if to_regclass('public.demandes') is not null and not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'demandes' and cmd = 'INSERT'
      and ('anon'::name = any (roles) or 'public'::name = any (roles))
  ) then
    create policy anon_insert_demandes on public.demandes for insert to anon with check (true);
  end if;
end $$;

-- 4. Photos : privées, envois limités ----------------------------------------
update storage.buckets
set public = false,
    file_size_limit = 8 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'photos';

do $$
declare
  p record;
begin
  for p in
    select policyname, cmd, roles from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') ilike '%photos%' or coalesce(with_check, '') ilike '%photos%')
  loop
    -- Conserve uniquement l'envoi anonyme depuis le formulaire du site.
    if p.cmd = 'INSERT' and ('anon'::name = any (p.roles) or 'public'::name = any (p.roles)) then
      continue;
    end if;
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

create policy admin_only_photos on storage.objects
  for all to authenticated
  using (bucket_id = 'photos' and (select public.is_admin()))
  with check (bucket_id = 'photos' and (select public.is_admin()));

commit;

-- 5. Vérification (s'affiche en résultat) ------------------------------------
select 'admin' as element, email as detail from public.admins
union all
select 'règle ' || schemaname || '.' || tablename, policyname || ' → ' || array_to_string(roles, ',') || ' ' || cmd
from pg_policies
where (schemaname = 'public' and tablename in ('clients', 'demandes', 'notes', 'settings', 'prestations', 'devis', 'factures', 'admins'))
   or (schemaname = 'storage' and tablename = 'objects')
order by 1, 2;
