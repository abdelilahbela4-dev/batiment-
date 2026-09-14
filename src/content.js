// AM Construction — contenu du site vitrine (FR).
// Ton : fierté artisanale, parole de compagnon. Des faits vérifiables, pas de slogans.

export const LANGS = ['fr'];

const PHONE_FR = '06 46 22 79 93';
const PHONE_INT = '+33 6 46 22 79 93';

export const content = {
  fr: {
    code: 'fr',
    siteName: 'AM Construction',
    contact: {
      phoneDisplay: PHONE_FR,
      phoneHref: PHONE_INT.replace(/\s/g, ''),
      email: 'am.construction.contact@gmail.com',
      address: '14 rue des Artisans, 90000 Belfort',
      hours: [
        ['Lundi – vendredi', '8 h – 18 h 30'],
        ['Samedi', '9 h – 12 h'],
      ],
      siret: 'SIRET 512 847 693 00027 · RCS Belfort',
    },
    nav: [
      { key: 'realisations', label: 'Projets' },
      { key: 'savoir-faire', label: 'Savoir-faire' },
      { key: 'methode', label: 'Méthode' },
      { key: 'atelier', label: 'L’atelier' },
      { key: 'contact', label: 'Contact' },
    ],
    navCta: 'Demander votre devis',
    navOpen: 'Menu',
    navClose: 'Fermer',

    meta: {
      home: {
        title: 'AM Construction · Construction & rénovation à Belfort (90) et environs',
        desc: 'Entreprise générale du bâtiment à Belfort et dans les environs : construction de maisons, rénovation, ouvertures de murs porteurs, piscines maçonnées. Devis détaillé, garantie décennale.',
      },
      devis: {
        title: 'Demander votre devis · AM Construction',
        desc: 'Décrivez votre projet en 5 étapes : type de travaux, coordonnées, délai et photos, adresse. Réponse sous 48 h.',
      },
    },

    common: {
      ctaDevis: 'Demander votre devis',
      ctaCall: `Appeler le ${PHONE_FR}`,
      call: 'Appeler',
      skip: 'Aller au contenu',
      homeLabel: 'accueil',
      mainNav: 'Navigation principale',
      mobileNav: 'Menu',
      allRights: 'Tous droits réservés.',
      footerTagline: 'Entreprise générale du bâtiment basée à Belfort. Construction, rénovation, ouvertures de murs porteurs et piscines, dans le Territoire de Belfort, le Nord Franche-Comté et les environs.',
      footerNavTitle: 'Le site',
      footerContactTitle: 'Nous trouver',
      footerHoursTitle: 'Horaires',
      footerCertsTitle: 'Garanties',
      certs: ['Garantie décennale', 'Devis détaillé sous 48 h', 'Interlocuteur unique'],
    },

    home: {
      hero: {
        title: 'On vous rend la maison <em>finie</em>.',
        sub: 'Construction, rénovation, ouvertures de murs porteurs et piscines, à Belfort et dans les environs. Un interlocuteur, un planning contractuel, un budget tenu.',
        cta: 'Demander votre devis',
        callPrefix: 'ou appelez le',
        seqAlt: 'La même maison, du crépi fissuré sous ciel gris jusqu’à la façade refaite en plein soleil.',
        // Phone only: the hero tells the chantier in three acts rather than two.
        // Every claim here is already made further down the page — the method
        // steps — so the hero promises nothing the site does not.
        beat2: {
          marker: 'Pendant',
          title: 'Un interlocuteur, <em>un planning signé</em>.',
          body: 'Devis détaillé poste par poste, dates de début et de fin écrites, point photo chaque semaine.',
        },
        beat3: {
          marker: 'Après',
          title: 'Le chantier se ferme, <em>votre histoire commence</em>.',
          body: 'Livré dans les délais, site impeccable. Ce qu’on écrit, on le construit.',
          cta: 'Parlons de votre maison',
        },
      },

      manifesto: {
        label: 'Notre engagement',
        lines: [
          'On ne vend pas des travaux.',
          'On rend une maison finie,',
          'dans les délais écrits au contrat,',
          'avec les mêmes compagnons jusqu’à la remise des clés.',
        ],
      },

      projects: {
        label: 'Réalisations',
        count: '4 maisons livrées',
        title: 'Quatre maisons livrées, <em>montrées comme des bâtiments</em>.',
        sub: 'Des maisons conduites par nos équipes, photographiées telles qu’elles ont été rendues à leurs propriétaires.',
        fields: { commune: 'Commune', surface: 'Surface', duree: 'Durée', livraison: 'Livraison' },
        // À compléter : renseignez commune, surface, durée et année de livraison.
        // Un champ laissé vide ('') n’apparaît pas sur le site.
        items: [
          {
            id: 'maison-meleze',
            img: 'maison-meleze', w: 1800, h: 1005,
            title: 'Maison cubique, enduit blanc et bardage mélèze',
            alt: 'Maison cubique à toit plat, enduit blanc, bardage mélèze vertical sur le volume garage, balcon vitré, menuiseries anthracite et jardin fleuri',
            meta: { commune: '', surface: '', duree: '', livraison: '' },
          },
          {
            id: 'maison-bordeaux',
            img: 'maison-bordeaux', w: 1800, h: 1344,
            title: 'Maison à toit plat, bandeau et porte de garage bordeaux',
            alt: 'Maison à toit plat, façade crème, bandeau et porte de garage bordeaux, massifs de lavande et d’hortensias',
            meta: { commune: '', surface: '', duree: '', livraison: '' },
          },
          {
            id: 'maison-rouge',
            img: 'maison-rouge', w: 1800, h: 1344,
            title: 'Maison cubique, volume garage rouge',
            alt: 'Maison cubique en enduit beige avec bandeau rouge et volume garage rouge, pelouse et allée en pierre',
            meta: { commune: '', surface: '', duree: '', livraison: '' },
          },
          {
            id: 'maison-crepuscule',
            img: 'maison-crepuscule', w: 1024, h: 1024,
            label: 'À la tombée du jour',
            title: 'Maison à patio, façade blanche <em>et volume noir</em>.',
            body: 'Appliques allumées, gravier ratissé, menuiseries alignées au millimètre : la même exigence de finition, jusque dans la lumière du soir.',
            alt: 'Maison contemporaine blanche avec volume noir à l’étage, garage et appliques murales allumées au crépuscule',
            meta: { commune: '', surface: '', duree: '', livraison: '' },
          },
        ],
      },

      // Before / after: each stage is a photo in src/media/transformations
      // (`${img}-960.jpg`, `-1800.jpg` and the WebP widths), listed in order.
      // The last stage is the finished work and is shown largest; a job can
      // have two or three stages.
      transformations: {
        label: 'Avant / après',
        count: '2 chantiers',
        title: 'Ce qu’on ouvre, <em>ce qu’on rend</em>.',
        sub: 'Deux chantiers photographiés à chaque étape, du premier coup de masse à la remise des clés.',
        items: [
          {
            id: 'ouverture-mur-porteur',
            title: 'Ouverture d’un mur porteur',
            body: 'Un mur de refend supprimé pour réunir l’entrée, l’escalier et le séjour. La maison est étayée, une poutre reprend la charge, puis murs, enduits et sols sont remis à neuf.',
            stages: [
              { name: 'Avant', caption: 'Démolition du mur, maison étayée', img: 'mur-porteur-avant', alt: 'Mur porteur en cours de démolition dans une maison ancienne, gravats de briques au sol et étais métalliques sous le plafond' },
              { name: 'Pendant', caption: 'La poutre reprend la charge', img: 'mur-porteur-pendant', alt: 'Grande ouverture dans le mur porteur, poutre en place au-dessus, étais encore installés, escalier visible au fond' },
              { name: 'Après', caption: 'Un seul volume, ouvert sur l’escalier', img: 'mur-porteur-apres', alt: 'Ouverture terminée entre deux piliers enduits, poutre bois apparente, escalier rénové et carreaux de ciment anciens conservés' },
            ],
          },
          {
            id: 'piscine',
            title: 'Piscine maçonnée',
            body: 'Un bassin monté en blocs à bancher, ferraillé et coulé, puis habillé de margelles claires. Le terrain est repris tout autour : le jardin retrouve sa place, la piscine en plus.',
            stages: [
              { name: 'Avant', caption: 'Bassin monté en blocs à bancher', img: 'piscine-avant', alt: 'Chantier de piscine : bassin rectangulaire en blocs à bancher avec armatures métalliques, terre retournée autour, maison en arrière-plan' },
              { name: 'Après', caption: 'Margelles posées, jardin rendu', img: 'piscine-apres', alt: 'Piscine rectangulaire terminée avec margelles claires, eau bleue, au milieu d’une pelouse neuve entre deux maisons' },
            ],
          },
        ],
      },

      services: {
        label: 'Savoir-faire',
        count: '5 métiers',
        title: 'Du plan <em>à la maison</em>.',
        sub: 'Cinq métiers réunis dans une seule entreprise. Faites défiler : le trait se dessine, puis la maison apparaît.',
        drawingLabel: 'Élévation au trait de la maison cubique à bardage mélèze, remplacée par sa photographie au fil du défilement',
        items: [
          { n: '01', title: 'Maçonnerie & gros œuvre', body: 'Fondations, dalles, élévation des murs, ouvertures de baies. La base solide de tout le reste, coulée et dressée par nos propres maçons.' },
          { n: '02', title: 'Construction de maisons', body: 'Des maisons individuelles clé en main, du plan d’architecte à la remise des clés. Prix et délai écrits dans le contrat, pas sur un coin de table.' },
          { n: '03', title: 'Rénovation & transformation', body: 'Rénovation complète ou partielle de maisons anciennes : structure, toiture, réseaux, pièces de vie. On respecte la maison, on change tout le reste.' },
          { n: '04', title: 'Ouvertures sur murs porteurs', body: 'Réunir deux pièces, créer une baie, ouvrir sur l’escalier. La maison est étayée, une poutre reprend la charge, puis tout est remis à neuf autour de l’ouverture.' },
          { n: '05', title: 'Piscines maçonnées', body: 'Bassins en blocs à bancher, ferraillés et coulés sur place, margelles posées et terrain repris tout autour. Une piscine construite comme une maison : pour durer.' },
        ],
      },

      method: {
        label: 'Méthode',
        count: '5 étapes',
        title: 'Une méthode, <em>pas des promesses</em>.',
        sub: 'Du premier rendez-vous à la réception, chaque étape est écrite avant de commencer.',
        steps: [
          { n: '1', title: 'Demandez votre devis', body: 'Gratuit et en ligne, en 3 minutes. Réponse sous 48 h.' },
          { n: '2', title: 'Devis détaillé', body: 'Poste par poste, prix ferme, sous 48 h à 5 jours selon complexité.' },
          { n: '3', title: 'Planning signé', body: 'Dates de début et de fin écrites, pénalités de retard à notre charge.' },
          { n: '4', title: 'Chantier suivi', body: 'Point photo chaque semaine, conducteur de travaux joignable.' },
          { n: '5', title: 'Réception & garanties', body: 'Visite de réception contradictoire, garantie décennale.' },
        ],
        guaranteesLabel: 'Garanties',
      },

      atelier: {
        label: 'L’atelier',
        count: 'Depuis 2015',
        role: 'Le fondateur',
        name: 'Aziz Amellah',
        body: [
          'Compagnon maçon formé au Tour de France, Aziz Amellah a toujours construit bien plus que des murs.',
          'Ce qui devait être un métier est devenu une vocation. Année après année, les chantiers se sont enchaînés, les projets ont grandi, les équipes aussi. Sans jamais perdre l’essentiel : le goût du travail bien fait et la parole donnée.',
          'Il ne pensait pas un jour aller aussi loin, ni voir autant de personnes lui confier leur maison, leur rénovation, leur projet. Mais une chose n’a jamais changé : quand Aziz dit qu’il fera quelque chose, il le fait.',
          'Au Maroc, on dit « 3endo lkelma » — il a une parole qui compte.',
          'C’est cette valeur qui guide encore chaque chantier : être présent, tenir ses engagements et laisser derrière soi un travail dont on peut être fier.',
        ],
        quote: 'Ce qu’on écrit, on le construit.',
        figures: [
          { value: '2015', label: 'Année de création' },
          { value: '140', label: 'Chantiers livrés' },
        ],
        alt: 'Portrait d’Aziz Amellah, fondateur d’AM Construction',
      },

      reviews: {
        label: 'Avis',
        title: 'Ce qu’en disent <em>les clients</em>.',
        sub: 'Avis vérifiés, chantiers visitables sur demande.',
        prev: 'Avis précédent',
        next: 'Avis suivant',
        items: [
          {
            text: 'Une équipe sérieuse, du premier coup de pioche au dernier coup de pinceau. Le planning annoncé a été tenu au jour près, et le chantier était propre chaque soir.',
            name: 'Marie & Laurent P.',
            place: 'Belfort',
            job: 'Rénovation complète d’une maison de ville',
          },
          {
            text: 'Devis clair, prix respecté, et un chef de chantier qui décroche son téléphone. L’extension a été livrée avant la date prévue. On recommande sans réserve.',
            name: 'Karim B.',
            place: 'Montbéliard',
            job: 'Extension bois de 40 m²',
          },
          {
            text: 'Notre longère est méconnaissable, dans le bon sens. Ils ont gardé les pierres et les poutres, et tout refait derrière. Le budget n’a pas bougé d’un euro.',
            name: 'Sophie & Marc D.',
            place: 'Héricourt',
            job: 'Rénovation d’une longère du XVIIIe',
          },
        ],
      },

      visit: {
        label: 'Contact',
        title: 'Parlons de <em>votre maison</em>.',
        body: 'Décrivez votre projet en ligne ou par téléphone. Devis détaillé poste par poste sous 48 h à 5 jours.',
        cta: 'Demander votre devis',
        callPrefix: 'ou appelez le',
        depot: 'Le dépôt',
        depotNote: 'Bureau et atelier. Chantiers à Belfort et dans toute la région.',
        hours: 'Horaires',
        write: 'Écrire',
      },
    },

    devis: {
      head: {
        title: 'Votre devis commence <em>ici</em>.',
        sub: 'Cinq étapes, trois minutes. Une fourchette de prix s’affiche au fil de vos réponses, puis un compagnon vous rappelle.',
      },
      trust: ['Gratuit et sans engagement', 'Réponse sous 48 h ouvrées', 'Vos photos restent privées'],
      steps: [
        { id: 'type', label: 'Projet' },
        { id: 'details', label: 'Détails' },
        { id: 'aides', label: 'Estimation' },
        { id: 'contact', label: 'Coordonnées' },
        { id: 'rappel', label: 'Rappel' },
      ],
      nav: { prev: 'Retour', next: 'Continuer', submit: 'Envoyer ma demande' },
      estimate: {
        title: 'Estimation en direct',
        empty: 'Choisissez un type de projet pour démarrer l’estimation.',
        range: 'Fourchette indicative',
        vat: 'TTC, finitions standard comprises',
        disclaimer: 'Estimation indicative à partir de nos chantiers récents. Le prix ferme est établi sur devis détaillé, sans engagement.',
        surfaceLabel: 'Surface estimée',
        perM2: 'soit {price} €/m²',
      },
      step1: {
        title: 'Quel est votre projet ?',
        sub: 'Une seule réponse possible. Vous pourrez préciser à l’étape suivante.',
        types: [
          { id: 'construction', icon: 'house', title: 'Maison neuve', desc: 'Construire sur votre terrain, clé en main' },
          { id: 'renovation', icon: 'roller', title: 'Rénovation', desc: 'Transformer ou rénover l’existant' },
          { id: 'extension', icon: 'expand', title: 'Extension', desc: 'Agrandir, surélever, ajouter un volume' },
          { id: 'isolation', icon: 'leaf', title: 'Isolation', desc: 'Murs, toiture, combles, menuiseries' },
          { id: 'amenagement', icon: 'layout', title: 'Aménagement', desc: 'Combles, garage, sous-sol à vivre' },
        ],
      },
      step2: {
        title: 'Parlez-nous du projet',
        sub: 'Ces réponses affinent la fourchette affichée à droite.',
        surface: 'Surface concernée',
        surfaceUnit: 'm²',
        delay: 'Quand souhaitez-vous démarrer ?',
        delays: [
          { id: 'asap', label: 'Dès que possible' },
          { id: '3-6', label: 'Dans 3 à 6 mois' },
          { id: '6-12', label: 'Dans 6 à 12 mois' },
          { id: 'info', label: 'Je me renseigne pour l’instant' },
        ],
        perType: {
          construction: {
            field: 'terrain', label: 'Où en êtes-vous du terrain ?',
            options: [
              { id: 'owned', label: 'Terrain signé' },
              { id: 'pending', label: 'Compromis en cours' },
              { id: 'searching', label: 'Je cherche encore' },
            ],
          },
          renovation: {
            field: 'ampleur', label: 'Quelle ampleur ?',
            options: [
              { id: 'partial', label: 'Rénovation partielle (quelques pièces)' },
              { id: 'full', label: 'Rénovation complète (structure, réseaux, finitions)' },
            ],
            energy: 'Inclure des travaux d’isolation ou de chauffage',
          },
          extension: {
            field: 'kind', label: 'Quel type d’agrandissement ?',
            options: [
              { id: 'wood', label: 'Extension bois' },
              { id: 'masonry', label: 'Extension maçonnée' },
              { id: 'raise', label: 'Surélévation' },
            ],
          },
          isolation: {
            field: 'postes', label: 'Quels postes isoler ?',
            multi: true,
            options: [
              { id: 'walls', label: 'Murs par l’extérieur' },
              { id: 'roof', label: 'Toiture' },
              { id: 'attic', label: 'Combles' },
              { id: 'windows', label: 'Menuiseries' },
            ],
          },
          amenagement: {
            field: 'space', label: 'Quel espace transformer ?',
            options: [
              { id: 'attic', label: 'Combles perdus' },
              { id: 'garage', label: 'Garage' },
              { id: 'basement', label: 'Sous-sol' },
              { id: 'barn', label: 'Dépendance ou grange' },
            ],
          },
        },
      },
      step3: {
        title: 'Votre estimation et vos aides',
        sub: 'La fourchette est recalculée à chaque réponse. Les aides dépendent de vos revenus : sélectionnez votre foyer pour les estimer.',
        bracketLabel: 'Revenus du foyer (avis d’imposition)',
        brackets: [
          { id: 'bleu', label: 'Très modestes', hint: 'couleur bleue sur le simulateur Anah' },
          { id: 'jaune', label: 'Modestes', hint: 'couleur jaune' },
          { id: 'violet', label: 'Intermédiaires', hint: 'couleur violette' },
          { id: 'rose', label: 'Supérieurs', hint: 'couleur rose' },
          { id: 'unknown', label: 'Je ne sais pas / non concerné' },
        ],
        aidsTitle: 'Aides estimées',
        noAids: 'Votre projet n’ouvre pas droit aux aides énergie. La TVA à 10 % s’applique en rénovation.',
        notEligible: 'Avec ces revenus, seuls la prime CEE et la TVA réduite restent accessibles.',
        unknown: 'Répondez à la question des revenus pour estimer vos aides.',
        lines: { maprimerenov: 'MaPrimeRénov’', cee: 'Prime énergie CEE', tva: 'TVA réduite à 5,5 %', tvaNote: 'appliquée au devis' },
        totalAids: 'Total des aides estimées',
        net: 'Reste estimé après aides',
        disclaimer: 'Montants indicatifs 2026, sous réserve d’éligibilité confirmée sur <a href="https://france-renov.gouv.fr" target="_blank" rel="noopener">france-renov.gouv.fr</a>.',
      },
      step4: {
        title: 'Où vous joindre ?',
        sub: 'Un conducteur de travaux vous rappelle. Pas de démarchage, pas de revente de données.',
        name: 'Nom et prénom',
        namePh: 'Ex. Claire Martin',
        email: 'E-mail',
        emailPh: 'claire@exemple.fr',
        phone: 'Téléphone',
        phonePh: '06 12 34 56 78',
        zip: 'Code postal du chantier',
        zipPh: '90000',
        message: 'Précisions utiles (facultatif)',
        messagePh: 'Accès au terrain, contraintes, historique de la maison…',
        photos: 'Photos du projet (facultatif)',
        photosHint: 'Jusqu’à 6 photos, 8 Mo chacune. Façades, pièces, plans : tout aide au premier chiffrage.',
        photosAdd: 'Ajouter des photos',
        consent: 'J’accepte qu’AM Construction me recontacte au sujet de ma demande.',
        errors: {
          name: 'Indiquez votre nom pour que l’on sache à qui parler.',
          email: 'Cet e-mail semble incomplet.',
          phone: 'Numéro de téléphone invalide.',
          zip: 'Code postal invalide.',
          consent: 'Sans votre accord, nous ne pouvons pas vous rappeler.',
        },
      },
      step5: {
        title: 'Quand vous rappelle-t-on ?',
        sub: 'Choisissez un créneau, ou envoyez sans rappel : nous répondons par écrit sous 48 h ouvrées.',
        dayLabel: 'Jour préféré',
        slotLabel: 'Créneau',
        slots: ['8 h 30 – 10 h', '10 h – 11 h 30', '14 h – 15 h 30', '16 h – 17 h 30'],
        noCall: 'Pas besoin de rappel, un e-mail suffit',
        weekdaysShort: ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'],
        monthsShort: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
      },
      confirm: {
        badge: 'Demande envoyée',
        title: 'C’est noté, {name}.',
        body: 'Votre demande est enregistrée sous la référence ci-dessous. Un conducteur de travaux vous recontacte {when}.',
        whenCall: 'au créneau choisi',
        whenMail: 'par écrit sous 48 h ouvrées',
        refLabel: 'Référence de votre demande',
        recap: 'Votre projet en résumé',
        next: 'La suite',
        nextItems: [
          { title: 'Prise de contact', body: 'Vérification des accès et des premières contraintes, 10 minutes au téléphone.' },
          { title: 'Devis détaillé', body: 'Poste par poste, prix ferme, sous 48 h à 5 jours selon complexité.' },
        ],
        backHome: 'Retour à l’accueil',
        newRequest: 'Faire une autre demande',
      },
      progress: 'Étape {n} sur {total}',
      required: 'Champ requis',
    },
  },
};
