-- AM Construction — durcissement avant la mise en production
-- ---------------------------------------------------------------------------
-- À exécuter dans Supabase > SQL Editor > New query, AVANT de publier l'admin.
-- Le script peut être relancé sans danger : chaque étape vérifie ce qui existe.
--
--   1. Formulaire public : limites de taille, champs autorisés, anti-abus
--   2. Photos : plafond d'envois
--   3. Factures : numérotation continue, sans trou, non modifiable
--   4. Tableau de bord : totaux calculés par la base, justes au-delà de 1 000 lignes
--   5. Index sur les colonnes de liaison
--   6. Client sans e-mail autorisé depuis l'admin
-- ---------------------------------------------------------------------------

begin;

-- Les fonctions internes vivent hors du schéma public : Supabase publie
-- automatiquement toute fonction de « public » comme point d'appel sur Internet.
-- Ici, personne ne doit pouvoir les appeler directement, sinon on pourrait
-- épuiser les plafonds anti-abus et bloquer les vrais clients.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;


-- ============================================================================
-- 6. Client sans e-mail (placé en premier : la contrainte 1 en dépend)
-- ============================================================================
-- Le formulaire « nouveau client » de l'admin rend l'e-mail facultatif, mais la
-- colonne l'exigeait : impossible d'enregistrer un client joignable uniquement
-- par téléphone. Le formulaire public, lui, continue d'exiger un e-mail.
alter table public.clients alter column email drop not null;


-- ============================================================================
-- 1. Formulaire public
-- ============================================================================

-- Limites de taille. NOT VALID : les lignes déjà présentes (données de test) ne
-- sont pas contrôlées, seules les nouvelles écritures le sont. Les limites sont
-- volontairement plus larges que ce que le formulaire accepte déjà, pour qu'un
-- vrai client ne tombe jamais dessus.
alter table public.clients drop constraint if exists clients_champs_limites;
alter table public.clients add constraint clients_champs_limites check (
  char_length(nom) between 1 and 100
  and char_length(prenom) between 1 and 100
  and (email is null or (char_length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'))
  and char_length(telephone) between 6 and 30
  and (whatsapp is null or char_length(whatsapp) <= 30)
  and (adresse is null or char_length(adresse) <= 200)
  and (code_postal is null or char_length(code_postal) <= 10)
  and (ville is null or char_length(ville) <= 100)
) not valid;

alter table public.demandes drop constraint if exists demandes_champs_limites;
alter table public.demandes add constraint demandes_champs_limites check (
  cardinality(type_travaux) between 1 and 10
  and (description is null or char_length(description) <= 2000)
  and (delai is null or char_length(delai) <= 20)
  and cardinality(coalesce(photos, '{}')) <= 6
  and char_length(array_to_string(coalesce(photos, '{}'), '')) <= 6000
) not valid;

-- Colonnes qu'un visiteur anonyme peut remplir. Sans cette restriction, il
-- pouvait fixer lui-même le statut d'une demande ou antidater sa création.
revoke insert, update, delete, truncate on public.clients from anon;
grant insert (id, nom, prenom, email, telephone, whatsapp, canal_prefere, adresse, code_postal, ville)
  on public.clients to anon;

revoke insert, update, delete, truncate on public.demandes from anon;
grant insert (id, client_id, type_travaux, description, delai, photos)
  on public.demandes to anon;

-- Journal anti-abus. Ne contient jamais d'adresse IP en clair, seulement une
-- empreinte, et chaque ligne est effacée au bout de 48 heures.
create table if not exists private.anti_abus_journal (
  id bigint generated always as identity primary key,
  cle text not null,
  type text not null,
  created_at timestamptz not null default now()
);
-- Trois verrous : le schéma « private » n'est pas publié sur Internet, aucun droit
-- n'est accordé aux visiteurs ni aux comptes connectés, et la sécurité par ligne
-- est activée sans aucune règle d'accès. Les fonctions anti-abus qui écrivent dans
-- ce journal appartiennent au propriétaire de la table et ne sont pas concernées.
alter table private.anti_abus_journal enable row level security;
revoke all on private.anti_abus_journal from public, anon, authenticated;
create index if not exists anti_abus_journal_type_date on private.anti_abus_journal (type, created_at);
create index if not exists anti_abus_journal_cle_date on private.anti_abus_journal (cle, created_at);
create index if not exists anti_abus_journal_date on private.anti_abus_journal (created_at);

-- Empreinte de l'expéditeur. Si l'adresse n'est pas transmise, on renvoie null :
-- le plafond par expéditeur est alors ignoré, mais le plafond global s'applique.
create or replace function private.anti_abus_cle()
returns text
language plpgsql
stable
security definer
set search_path = private, pg_temp
as $$
declare
  entetes json := coalesce(nullif(current_setting('request.headers', true), '')::json, '{}'::json);
  ip text := btrim(coalesce(entetes->>'cf-connecting-ip', split_part(coalesce(entetes->>'x-forwarded-for', ''), ',', 1)));
begin
  if ip is null or ip = '' then
    return null;
  end if;
  return md5(ip);
end;
$$;

-- Refuse l'envoi au-delà d'un plafond par expéditeur et d'un plafond global.
-- Renvoie true si l'envoi est accepté (et l'inscrit au journal).
create or replace function private.anti_abus_accepter(
  p_type text,
  p_max_expediteur int,
  p_fenetre_expediteur interval,
  p_max_global int,
  p_fenetre_global interval
)
returns boolean
language plpgsql
volatile
security definer
set search_path = private, pg_temp
as $$
declare
  k text := private.anti_abus_cle();
begin
  delete from private.anti_abus_journal where created_at < now() - interval '48 hours';

  if k is not null and (
    select count(*) from private.anti_abus_journal
    where cle = k and type = p_type and created_at > now() - p_fenetre_expediteur
  ) >= p_max_expediteur then
    return false;
  end if;

  if (
    select count(*) from private.anti_abus_journal
    where type = p_type and created_at > now() - p_fenetre_global
  ) >= p_max_global then
    return false;
  end if;

  insert into private.anti_abus_journal (cle, type) values (coalesce(k, 'inconnu'), p_type);
  return true;
end;
$$;
revoke all on function private.anti_abus_cle() from public, anon, authenticated;
revoke all on function private.anti_abus_accepter(text, int, interval, int, interval) from public, anon, authenticated;

-- Déclenché avant chaque insertion. Ne s'applique qu'aux visiteurs anonymes :
-- Aziz, connecté dans l'admin, n'est jamais limité.
create or replace function private.anti_abus_formulaire()
returns trigger
language plpgsql
security definer
set search_path = private, pg_temp
as $$
declare
  role_appelant text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::json->>'role', '');
  genre text;
begin
  if role_appelant <> 'anon' then
    return new;
  end if;

  genre := case when tg_table_name = 'clients' then 'client' else 'demande' end;

  -- 5 envois par expéditeur en 10 minutes, 60 au total par heure : très
  -- au-dessus de l'activité réelle d'une entreprise locale.
  if not private.anti_abus_accepter(genre, 5, interval '10 minutes', 60, interval '1 hour') then
    raise exception 'Trop de demandes envoyées. Merci de réessayer dans quelques minutes.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;
revoke all on function private.anti_abus_formulaire() from public, anon, authenticated;

drop trigger if exists anti_abus_clients on public.clients;
create trigger anti_abus_clients
  before insert on public.clients
  for each row execute function private.anti_abus_formulaire();

drop trigger if exists anti_abus_demandes on public.demandes;
create trigger anti_abus_demandes
  before insert on public.demandes
  for each row execute function private.anti_abus_formulaire();


-- ============================================================================
-- 2. Photos : plafond d'envois
-- ============================================================================
-- Chaque photo peut peser 8 Mo : sans plafond, un script pourrait remplir tout
-- l'espace de stockage de l'offre gratuite. Plafonds : 12 photos par expéditeur
-- en 10 minutes, 40 par heure et 100 par jour au total.
--
-- Note : le service de stockage ne transmet pas forcément l'adresse de
-- l'expéditeur. Dans ce cas seuls les plafonds globaux s'appliquent.
create or replace function private.photos_envoi_autorise(p_bucket text)
returns boolean
language plpgsql
volatile
security definer
set search_path = private, pg_temp
as $$
begin
  if p_bucket is distinct from 'photos' then
    return true;
  end if;

  if (
    select count(*) from private.anti_abus_journal
    where type = 'photo' and created_at > now() - interval '24 hours'
  ) >= 100 then
    return false;
  end if;

  return private.anti_abus_accepter('photo', 12, interval '10 minutes', 40, interval '1 hour');
end;
$$;
-- Une règle d'accès appelle cette fonction avec le rôle du visiteur : il lui
-- faut le droit d'exécution. Le schéma « private » n'étant pas publié, ce droit
-- ne la rend pas appelable depuis Internet.
revoke all on function private.photos_envoi_autorise(text) from public;
grant execute on function private.photos_envoi_autorise(text) to anon;

-- Remplace la règle d'envoi anonyme existante, quel que soit son nom.
do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and cmd = 'INSERT'
      and ('anon'::name = any (roles) or 'public'::name = any (roles))
      and coalesce(with_check, '') ilike '%photos%'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- Couvre aussi le cas d'une règle du même nom qui n'aurait pas été reconnue plus haut.
drop policy if exists anon_upload_photos on storage.objects;
create policy anon_upload_photos on storage.objects
  for insert to anon
  with check (bucket_id = 'photos' and private.photos_envoi_autorise(bucket_id));


-- ============================================================================
-- 3. Factures : numérotation continue
-- ============================================================================
-- Jusqu'ici le numéro de facture était recopié sur celui du devis
-- (DEV-2026-005 devenait FAC-2026-005) : chaque devis refusé laissait un trou
-- dans la suite des factures, et le numéro restait modifiable à la main.
--
-- Désormais c'est la base qui attribue le numéro, au moment même où la facture
-- est créée et dans la même transaction : si l'enregistrement échoue, le numéro
-- n'est pas consommé. La suite repart à 001 chaque année.
--
-- Une facture n'ayant pas d'état « brouillon », elle est émise dès sa création.
-- Seule la dernière de la suite peut donc être supprimée (erreur de saisie
-- juste après la création). Une facture déjà envoyée à un client ne doit pas
-- être supprimée : on la corrige par un avoir.

create or replace function private.numero_formater(p_prefixe text, p_annee int, p_rang int)
returns text
language sql
immutable
as $$
  -- lpad tronque les valeurs trop longues : au-delà de 999, on garde tous les chiffres.
  select p_prefixe || '-' || p_annee || '-' ||
    case when p_rang < 1000 then lpad(p_rang::text, 3, '0') else p_rang::text end;
$$;

create or replace function private.facture_numero_attribuer()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  annee int;
  dernier int;
begin
  perform pg_advisory_xact_lock(hashtext('am_construction.facture_numero'));

  annee := extract(year from coalesce(new.date, current_date))::int;

  select coalesce(max(substring(f.numero from '^FAC-' || annee || '-([0-9]+)$')::int), 0)
    into dernier
    from public.factures f;

  -- Le numéro envoyé par l'application est ignoré : il ne peut pas être imposé.
  new.numero := private.numero_formater('FAC', annee, dernier + 1);
  return new;
end;
$$;

create or replace function private.facture_numero_proteger()
returns trigger
language plpgsql
as $$
begin
  if new.numero is distinct from old.numero then
    raise exception 'Le numéro d''une facture émise ne peut pas être modifié.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create or replace function private.facture_suppression_controler()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  annee text;
  rang int;
  dernier int;
begin
  annee := substring(old.numero from '^FAC-([0-9]{4})-[0-9]+$');
  -- Numéro d'un autre format : aucune suite à protéger.
  if annee is null then
    return old;
  end if;

  perform pg_advisory_xact_lock(hashtext('am_construction.facture_numero'));

  rang := substring(old.numero from '^FAC-[0-9]{4}-([0-9]+)$')::int;
  select max(substring(f.numero from '^FAC-' || annee || '-([0-9]+)$')::int)
    into dernier
    from public.factures f;

  if rang < dernier then
    raise exception 'Seule la dernière facture peut être supprimée. Une facture déjà envoyée se corrige par un avoir.'
      using errcode = 'P0001';
  end if;

  return old;
end;
$$;

revoke all on function private.numero_formater(text, int, int) from public, anon;
revoke all on function private.facture_numero_attribuer() from public, anon, authenticated;
revoke all on function private.facture_numero_proteger() from public, anon, authenticated;
revoke all on function private.facture_suppression_controler() from public, anon, authenticated;

drop trigger if exists facture_numero_attribuer on public.factures;
create trigger facture_numero_attribuer
  before insert on public.factures
  for each row execute function private.facture_numero_attribuer();

drop trigger if exists facture_numero_proteger on public.factures;
create trigger facture_numero_proteger
  before update of numero on public.factures
  for each row execute function private.facture_numero_proteger();

drop trigger if exists facture_suppression_controler on public.factures;
create trigger facture_suppression_controler
  before delete on public.factures
  for each row execute function private.facture_suppression_controler();

-- Même défaut de troncature pour les devis au-delà de 999 : corrigé.
create or replace function public.next_devis_numero()
returns text
language sql
as $$
  select private.numero_formater('DEV', extract(year from current_date)::int, nextval('public.devis_num_seq')::int);
$$;
grant execute on function private.numero_formater(text, int, int) to authenticated, service_role;

-- L'ancienne fonction de numérotation des factures n'est plus utilisée : la
-- supprimer évite qu'on s'en serve et recrée des trous.
drop function if exists public.next_facture_numero();


-- ============================================================================
-- 4. Tableau de bord
-- ============================================================================
-- L'admin chargeait toutes les demandes, tous les devis et toutes les factures
-- pour les additionner. Supabase ne renvoie que 1 000 lignes : au-delà, les
-- totaux (y compris les montants) auraient été faux sans aucun avertissement.
create or replace function public.tableau_de_bord()
returns json
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with montants as (
    select
      statut,
      date,
      case when (totaux->>'total_ttc') ~ '^-?[0-9]+(\.[0-9]+)?$'
           then (totaux->>'total_ttc')::numeric else 0 end as ttc
    from public.factures
  ),
  devis_montants as (
    select
      statut,
      case when (totaux->>'total_ttc') ~ '^-?[0-9]+(\.[0-9]+)?$'
           then (totaux->>'total_ttc')::numeric else 0 end as ttc
    from public.devis
  )
  select json_build_object(
    'demandes_nouvelles', (select count(*) from public.demandes where statut = 'Nouveau'),
    'demandes_aujourdhui', (
      select count(*) from public.demandes
      where (created_at at time zone 'Europe/Paris')::date = (now() at time zone 'Europe/Paris')::date
    ),
    'devis_envoyes', (select count(*) from devis_montants where statut = 'envoye'),
    'devis_envoyes_ttc', (select coalesce(sum(ttc), 0) from devis_montants where statut = 'envoye'),
    'factures_impayees', (select count(*) from montants where statut in ('impayee', 'partielle')),
    'factures_impayees_ttc', (select coalesce(sum(ttc), 0) from montants where statut in ('impayee', 'partielle')),
    'encaisse_mois_ttc', (
      select coalesce(sum(ttc), 0) from montants
      where statut = 'payee'
        and date >= date_trunc('month', (now() at time zone 'Europe/Paris'))::date
        and date < (date_trunc('month', (now() at time zone 'Europe/Paris')) + interval '1 month')::date
    ),
    'pipeline', (
      select coalesce(json_object_agg(statut, n), '{}'::json)
      -- json_object_agg refuse une clé vide : une seule demande sans statut ferait
      -- échouer tout le tableau de bord.
      from (select statut, count(*) as n from public.demandes where statut is not null group by statut) s
    )
  );
$$;
revoke all on function public.tableau_de_bord() from public, anon;
grant execute on function public.tableau_de_bord() to authenticated, service_role;


-- ============================================================================
-- 5. Index
-- ============================================================================
-- Postgres ne crée pas d'index sur les clés étrangères : sans eux, retrouver les
-- demandes ou factures d'un client parcourt toute la table.
create index if not exists demandes_client_id_idx  on public.demandes (client_id);
create index if not exists demandes_created_at_idx on public.demandes (created_at desc);
create index if not exists notes_client_id_idx     on public.notes (client_id);
create index if not exists notes_demande_id_idx    on public.notes (demande_id);
create index if not exists devis_client_id_idx     on public.devis (client_id);
create index if not exists devis_demande_id_idx    on public.devis (demande_id);
create index if not exists devis_created_at_idx    on public.devis (created_at desc);
create index if not exists factures_client_id_idx  on public.factures (client_id);
create index if not exists factures_devis_id_idx   on public.factures (devis_id);
create index if not exists factures_created_at_idx on public.factures (created_at desc);
create index if not exists clients_created_at_idx  on public.clients (created_at desc);

commit;


-- ============================================================================
-- Vérification : doit renvoyer 9 lignes marquées OK
-- ============================================================================
select 'email facultatif' as controle,
  case when exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'email' and is_nullable = 'YES')
  then 'OK' else 'MANQUANT' end as etat
union all
select 'limites clients', case when exists (select 1 from pg_constraint where conname = 'clients_champs_limites') then 'OK' else 'MANQUANT' end
union all
select 'limites demandes', case when exists (select 1 from pg_constraint where conname = 'demandes_champs_limites') then 'OK' else 'MANQUANT' end
union all
select 'anti-abus formulaire', case when (select count(*) from pg_trigger where tgname in ('anti_abus_clients', 'anti_abus_demandes')) = 2 then 'OK' else 'MANQUANT' end
union all
select 'plafond photos', case when exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'anon_upload_photos' and with_check ilike '%photos_envoi_autorise%') then 'OK' else 'MANQUANT' end
union all
select 'numérotation factures', case when (select count(*) from pg_trigger where tgname in ('facture_numero_attribuer', 'facture_numero_proteger', 'facture_suppression_controler')) = 3 then 'OK' else 'MANQUANT' end
union all
select 'ancienne numérotation retirée', case when not exists (select 1 from pg_proc where proname = 'next_facture_numero') then 'OK' else 'MANQUANT' end
union all
select 'tableau de bord', case when exists (select 1 from pg_proc where proname = 'tableau_de_bord') then 'OK' else 'MANQUANT' end
union all
select 'index', case when (select count(*) from pg_indexes where schemaname = 'public' and indexname in (
  'demandes_client_id_idx', 'demandes_created_at_idx', 'notes_client_id_idx', 'notes_demande_id_idx',
  'devis_client_id_idx', 'devis_demande_id_idx', 'devis_created_at_idx', 'factures_client_id_idx',
  'factures_devis_id_idx', 'factures_created_at_idx', 'clients_created_at_idx')) = 11 then 'OK' else 'MANQUANT' end;
