-- AM Construction — champs obligatoires des devis et factures
-- ---------------------------------------------------------------------------
-- À exécuter dans Supabase > SQL Editor > New query.
-- Ajoute les colonnes exigées par la réglementation française sur les devis et
-- factures du bâtiment. Toutes les colonnes sont facultatives (NULL autorisé) :
-- rien ne casse si elles restent vides, elles n'apparaissent alors pas sur le PDF.
-- ---------------------------------------------------------------------------

begin;

-- Client professionnel : le SIRET doit figurer sur la facture.
alter table public.clients
  add column if not exists siret text;

-- Devis : lieu d'exécution, planning et référence commande.
alter table public.devis
  add column if not exists adresse_chantier text,
  add column if not exists date_debut date,
  add column if not exists duree_travaux text,
  add column if not exists bon_commande text;

-- Facture : date de la vente / fin des travaux (distincte de la date d'émission),
-- référence commande et lieu d'exécution.
alter table public.factures
  add column if not exists date_execution date,
  add column if not exists bon_commande text,
  add column if not exists adresse_chantier text;

comment on column public.factures.date_execution is
  'Date de la vente ou de fin de prestation (mention obligatoire, distincte de la date d''émission).';
comment on column public.devis.adresse_chantier is
  'Adresse du chantier si elle diffère de l''adresse du client.';

commit;

-- Vérification
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'clients' and column_name = 'siret')
    or (table_name = 'devis' and column_name in ('adresse_chantier', 'date_debut', 'duree_travaux', 'bon_commande'))
    or (table_name = 'factures' and column_name in ('date_execution', 'bon_commande', 'adresse_chantier'))
  )
order by table_name, column_name;
