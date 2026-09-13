-- AM Construction — suppression des demandes et des clients, numéros de facture modifiables
-- ---------------------------------------------------------------------------
-- À exécuter dans Supabase > SQL Editor > New query, AVANT de publier l'admin.
-- À lancer APRÈS 2026-09-13_mise_en_production.sql. Relançable sans danger.
--
--   1. Numéro de facture modifiable, sans jamais fausser la suite
--   2. Suppression d'un client en une seule opération
--
-- La suppression d'une demande n'a pas besoin de ce script : la base sait déjà
-- la retirer seule, en conservant les devis et les notes qui y étaient liés.
-- ---------------------------------------------------------------------------

begin;


-- ============================================================================
-- 1. Numéro de facture modifiable
-- ============================================================================
-- Remplace le verrou posé le 13 septembre, qui interdisait toute modification.
-- On peut désormais changer le numéro, par exemple pour reprendre la suite des
-- factures émises avant l'admin, mais trois garde-fous restent en place :
--
--   - le format reste FAC-ANNÉE-NUMÉRO (la numérotation automatique en dépend) ;
--   - le numéro est remis au format : « fac-2026-7 » devient « FAC-2026-007 » ;
--   - un numéro déjà utilisé est refusé, en comparant l'année et le rang et non
--     le texte : FAC-2026-7 et FAC-2026-007 sont bien le même numéro.
--
-- La facture suivante prend automatiquement le plus grand numéro de l'année + 1.

create or replace function private.facture_numero_modifier()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  saisie text;
  annee int;
  rang int;
begin
  if new.numero is not distinct from old.numero then
    return new;
  end if;

  saisie := upper(btrim(coalesce(new.numero, '')));

  -- 6 chiffres au plus : de quoi numéroter toute une vie d'entreprise, sans
  -- risque de dépasser la taille d'un entier.
  if saisie !~ '^FAC-[0-9]{4}-[0-9]{1,6}$' then
    raise exception 'Numéro de facture invalide. Format attendu : FAC-2026-001.'
      using errcode = 'P0001';
  end if;

  annee := substring(saisie from '^FAC-([0-9]{4})-')::int;
  rang := substring(saisie from '-([0-9]+)$')::int;

  if rang < 1 then
    raise exception 'Le numéro de facture doit être supérieur à zéro.'
      using errcode = 'P0001';
  end if;

  -- Même verrou que l'attribution automatique : une facture créée au même
  -- instant ne peut pas recevoir le numéro qu'on est en train de choisir.
  perform pg_advisory_xact_lock(hashtext('am_construction.facture_numero'));

  if exists (
    select 1
    from public.factures f
    where f.id <> new.id
      and upper(f.numero) ~ ('^FAC-' || annee || '-[0-9]+$')
      and substring(upper(f.numero) from '-([0-9]+)$')::numeric = rang
  ) then
    raise exception 'Le numéro % est déjà utilisé par une autre facture.',
      private.numero_formater('FAC', annee, rang)
      using errcode = 'P0001';
  end if;

  new.numero := private.numero_formater('FAC', annee, rang);
  return new;
end;
$$;
revoke all on function private.facture_numero_modifier() from public, anon, authenticated;

drop trigger if exists facture_numero_proteger on public.factures;
drop trigger if exists facture_numero_modifier on public.factures;
create trigger facture_numero_modifier
  before update of numero on public.factures
  for each row execute function private.facture_numero_modifier();

drop function if exists private.facture_numero_proteger();


-- ============================================================================
-- 2. Suppression d'un client
-- ============================================================================
-- Supprimer un client touche plusieurs tables : ses demandes et ses notes
-- partent avec lui, mais ses devis bloquaient la suppression (la base refusait
-- avec une erreur technique). Tout est fait ici dans une seule transaction :
-- soit tout est supprimé, soit rien ne l'est, jamais à moitié.
--
-- Un client qui a au moins une facture n'est jamais supprimé : les factures
-- doivent être conservées. La fonction renvoie les adresses des photos de ses
-- demandes, pour que l'admin retire aussi les fichiers du stockage.

create or replace function public.supprimer_client(p_client uuid)
returns text[]
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  nb_factures int;
  photos text[];
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;

  select count(*) into nb_factures from public.factures where client_id = p_client;
  if nb_factures > 0 then
    raise exception 'Ce client a % facture(s) : il ne peut pas être supprimé, car les factures doivent être conservées.',
      nb_factures
      using errcode = 'P0001';
  end if;

  select coalesce(array_agg(p), '{}')
    into photos
    from public.demandes d
    cross join lateral unnest(coalesce(d.photos, '{}')) as p
    where d.client_id = p_client;

  -- Les devis d'abord : ce sont eux qui empêchaient la suppression du client.
  -- Ses demandes et ses notes suivent automatiquement avec le client.
  delete from public.devis where client_id = p_client;
  delete from public.clients where id = p_client;

  if not found then
    raise exception 'Client introuvable.' using errcode = 'P0002';
  end if;

  return photos;
end;
$$;
revoke all on function public.supprimer_client(uuid) from public, anon;
grant execute on function public.supprimer_client(uuid) to authenticated;

commit;


-- ============================================================================
-- Vérification : doit renvoyer 3 lignes marquées OK
-- ============================================================================
select 'numéro de facture modifiable' as controle,
  case when exists (select 1 from pg_trigger where tgname = 'facture_numero_modifier')
        and not exists (select 1 from pg_trigger where tgname = 'facture_numero_proteger')
  then 'OK' else 'MANQUANT' end as etat
union all
select 'suppression de client', case when exists (select 1 from pg_proc where proname = 'supprimer_client') then 'OK' else 'MANQUANT' end
union all
select 'numérotation automatique intacte', case when exists (select 1 from pg_trigger where tgname = 'facture_numero_attribuer') then 'OK' else 'MANQUANT' end;
