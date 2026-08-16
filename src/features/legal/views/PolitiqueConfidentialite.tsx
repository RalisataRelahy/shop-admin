import './LegalDocumentsPage.css';

const content = {
  title: 'POLITIQUE DE CONFIDENTIALITÉ – Shop Good',
  lastUpdated: 'Dernière mise à jour : 24 Mai 2024',
  sections: [
    {
      heading: '1. LES DONNÉES QUE NOUS COLLECTONS',
      paragraphs: [
        'Nous collectons uniquement les informations strictement nécessaires à la fourniture de nos services de restauration et de livraison :',
        'Informations de compte : Pseudo, adresse email et numéro de téléphone (obligatoire pour le suivi des livraisons).',
        'Données de localisation : Coordonnées GPS (uniquement lors de la commande) pour calculer les frais de livraison et guider le livreur jusqu\'à vous.',
        'Historique de commandes : Plats commandés, mode de paiement choisi et notes spéciales.',
        'Données techniques : Token de l\'appareil (FCM) pour l\'envoi des notifications de statut de commande.'
      ]
    },
    {
      heading: '2. UTILISATION DE VOS DONNÉES',
      paragraphs: [
        'Vos données sont traitées pour :',
        'Gérer vos commandes : Préparation, facturation et livraison.',
        'Appliquer vos avantages : Calculer automatiquement votre remise de 5% si vous êtes connecté.',
        'Communication : Vous informer de l\'évolution de votre commande (Reçue, En préparation, En route, Livrée).',
        'Assistance : Vous aider via notre bouton d\'appel direct en cas de problème avec votre compte.'
      ]
    },
    {
      heading: '3. CONSERVATION ET SÉCURITÉ',
      paragraphs: [
        'Infrastructure : Vos données sont stockées de manière sécurisée via Supabase, utilisant un chiffrement de niveau industriel.',
        'Durée : Nous conservons vos données tant que votre compte est actif.',
        'Suppression : Vous pouvez à tout moment supprimer l\'intégralité de vos données via le bouton "Supprimer mon compte" dans les paramètres de votre profil. Cette action est irréversible.'
      ]
    },
    {
      heading: '4. PARTAGE AVEC DES TIERS',
      paragraphs: [
        'Nous ne vendons jamais vos données personnelles. Elles sont partagées uniquement avec nos prestataires techniques nécessaires au fonctionnement de l\'app :',
        'Supabase : Gestion de la base de données et de l\'authentification.',
        'Firebase (Google) : Envoi des notifications push.',
        'Nominatim/OSM : Conversion de votre adresse en coordonnées GPS (sans lien direct avec votre identité).'
      ]
    },
    {
      heading: '5. GÉOLOCALISATION ET NOTIFICATIONS',
      paragraphs: [
        'GPS : L\'accès à votre position n\'est demandé que pour garantir la précision de la livraison. Vous pouvez refuser cette permission dans les réglages de votre téléphone.',
        'Notifications : Vous pouvez désactiver les alertes sonores ou visuelles dans les paramètres de l\'application.'
      ]
    },
    {
      heading: '6. VOS DROITS',
      paragraphs: [
        'Conformément aux standards de protection des données, vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données. Pour toute question, vous pouvez nous contacter directement via le numéro d\'assistance fourni dans l\'application.'
      ]
    },
    {
      heading: '7. MODIFICATIONS',
      paragraphs: [
        'Shop Good se réserve le droit de mettre à jour cette politique. En cas de modification majeure, vous serez informé via une notification dans l\'application.'
      ]
    }
  ]
};

export default function PolitiqueConfidentialite() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <span className="legal-kicker">Informations légales</span>
        <h1>{content.title}</h1>
      </header>

      <article className="legal-card">
        <h2>{content.title}</h2>

        <div className="legal-meta">{content.lastUpdated}</div>

        {content.sections.map((section) => (
          <section key={section.heading} className="legal-section">
            <h3>{section.heading}</h3>
            {section.paragraphs.map((paragraph, index) => (
              <p key={`${section.heading}-${index}`}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
