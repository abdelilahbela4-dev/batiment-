-- AM Construction — règles de suppression des demandes et des clients
-- ---------------------------------------------------------------------------
-- À exécuter dans Supabase > SQL Editor > New query, AVANT de publier l'admin.
-- À lancer APRÈS 2026-09-13b_suppressions_et_numeros.sql. Relançable sans danger.
--
-- Nouvelle règle : dès qu'un client a un devis ou une facture (ou les deux),
--   - le client ne peut plus être supprimé ;
--   - aucune de ses demandes ne peut plus être supprimée.
--
-- L'admin l'explique avant même d'essayer ; la base l'impose en plus, pour que
-- la règle tienne même si quelqu'un contournait l'écran.
-- ---------------------------------------------------------------------------

begin;

-- Libellé lisible : « 1 devis », « 2 factures », « 1 devis et 3 factures ».
create or replace function private.documents_libelle(p_devis int, p_factures int)
returns text
language sql
immutable
as $$
  select concat_ws(' et ',
    case when p_devis > 0 then p_devis || ' devis' end,
    case when p_factures = 1 then '1 facture'
         when p_factures > 1 then p_factures || ' factures' end);
$$;
revoke all on function private.documents_libelle(int, int) from public, anon;


-- ============================================================================
-- 1. Demandes
-- ============================================================================
-- Avant, supprimer une demande détachait simplement les devis qui y étaient
-- liés. Désormais, une demande dont le client a déjà un devis ou une facture est
-- conservée : elle fait partie de l'historique du dossier.
--
-- Ce contrôle s'applique aussi quand une demande part avec son client. Il ne
-- gêne jamais cette suppression-là : un client qui a un devis ou une facture est
-- de toute façon refusé avant (section 2).

create or replace function private.demande_suppression_controler()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  nb_devis int;
  nb_factures int;
begin
  select count(*) into nb_devis from public.devis where client_id = old.client_id;
  select count(*) into nb_factures from public.factures where client_id = old.client_id;

  if nb_devis > 0 or nb_factures > 0 then
    raise exception 'Cette demande ne peut pas être supprimée : ce client a déjà %.',
      private.documents_libelle(nb_devis, nb_factures)
      using errcode = 'P0001';
  end if;

  return old;
end;
$$;
revoke all on function private.demande_suppression_controler() from public, anon, authenticated;

drop trigger if exists demande_suppression_controler on public.demandes;
create trigger demande_suppression_controler
  before delete on public.demandes
  for each row execute function private.demande_suppression_controler();


-- ============================================================================
-- 2. Clients
-- ============================================================================
-- Remplace la version du 13 septembre (b), qui refusait un client ayant une
-- facture mais supprimait ses devis avec lui. Désormais un devis suffit aussi à
-- conserver le client. Tout reste fait dans une seule transaction.

create or replace function public.supprimer_client(p_client uuid)
returns text[]
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  nb_devis int;
  nb_factures int;
  photos text[];
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;

  select count(*) into nb_devis from public.devis where client_id = p_client;
  select count(*) into nb_factures from public.factures where client_id = p_client;

  if nb_devis > 0 or nb_factures > 0 then
    raise exception 'Ce client ne peut pas être supprimé : il a déjà %.',
      private.documents_libelle(nb_devis, nb_factures)
      using errcode = 'P0001';
  end if;

  select coalesce(array_agg(p), '{}')
    into photos
    from public.demandes d
    cross join lateral unnest(coalesce(d.photos, '{}')) as p
    where d.client_id = p_client;

  -- Ses demandes et ses notes suivent automatiquement avec le client.
  delete from public.clients where id = p_client;

  if not found then
    raise exception 'Client introuvable.' using errcode = 'P0002';
  end if;

  return photos;
end;
$$;
revoke all on function public.supprimer_client(uuid) from public, anon;
grant execute on function public.supprimer_client(uuid) to authenticated;

-- supprimer_client est « security invoker » : l'appelant (Aziz) doit pouvoir
-- utiliser le libellé.
grant execute on function private.documents_libelle(int, int) to authenticated;

commit;


-- ============================================================================
-- Vérification : doit renvoyer 3 lignes marquées OK
-- ============================================================================
select 'demande protégée si devis ou facture' as controle,
  case when exists (select 1 from pg_trigger where tgname = 'demande_suppression_controler')
  then 'OK' else 'MANQUANT' end as etat
union all
select 'client protégé si devis ou facture',
  case when position('nb_devis' in (select prosrc from pg_proc where proname = 'supprimer_client' limit 1)) > 0
  then 'OK' else 'MANQUANT' end
union all
select 'libellé des documents',
  case when private.documents_libelle(1, 2) = '1 devis et 2 factures'
        and private.documents_libelle(0, 1) = '1 facture'
        and private.documents_libelle(3, 0) = '3 devis'
  then 'OK' else 'MANQUANT' end;
