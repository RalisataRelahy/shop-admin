import './LegalDocumentsPage.css';

const content = {
  title: 'CONDITIONS GÉNÉRALES D\'UTILISATION (CGU) – Shop Good',
  lastUpdated: 'Dernière mise à jour : Octobre 2026',
  sections: [
    {
      heading: '1. PRÉAMBULE',
      paragraphs: [
        'L\'application "Shop Good" est une plateforme de commande en ligne permettant aux utilisateurs de commander des produits de restauration, des boissons et des services de livraison. En utilisant cette application, vous acceptez sans réserve les présentes conditions.'
      ]
    },
    {
      heading: '2. SERVICES ET INSCRIPTION',
      paragraphs: [
        'Accès : L\'application est accessible en mode "Invité" ou via un compte utilisateur.',
        'Avantage Fidélité : La création d\'un compte personnel permet de bénéficier d\'une remise automatique de 5% sur l\'ensemble des commandes (hors frais de livraison).',
        'Exactitude des informations : L\'utilisateur s\'engage à fournir un numéro de téléphone et une adresse de livraison exacts.'
      ]
    },
    {
      heading: '3. COMMANDES ET PAIEMENTS',
      paragraphs: [
        'Validation : Une commande est considérée comme définitive dès sa confirmation sur l\'application.',
        'Prix : Les prix sont affichés en Ariary (Ar). Shop Good se réserve le droit de modifier ses prix à tout moment.',
        'Modes de Règlement : Espèces (à la livraison ou au retrait), Mobile Money (Mvola, Orange Money, Airtel Money), Cartes Bancaires (selon disponibilité).'
      ]
    },
    {
      heading: '4. LIVRAISON ET RETRAIT (PICKUP)',
      paragraphs: [
        'Zone de livraison : La livraison est limitée à un rayon de 12 km autour de notre établissement à Soanierana.',
        'Frais : Les frais de livraison sont calculés selon la distance routière réelle.',
        'Délais : Les délais sont donnés à titre indicatif. Shop Good ne pourra être tenu responsable en cas de retard dû à la circulation ou à des cas de force majeure.',
        'Retrait en magasin : Pour le mode "Pickup", l\'utilisateur s\'engage à se présenter à l\'heure sélectionnée.'
      ]
    },
    {
      heading: '5. ANNULATION ET RÉTRACTATION',
      paragraphs: [
        'Produits périssables : Conformément aux usages de la restauration, le droit de rétractation ne s\'applique pas aux produits alimentaires déjà en cours de préparation ou livrés.',
        'Annulation : Toute annulation doit être effectuée avant que la commande ne passe au statut "En préparation".'
      ]
    },
    {
      heading: '6. PROTECTION DES DONNÉES (PRIVACY)',
      paragraphs: [
        'Collecte : Nous collectons votre pseudo, email, téléphone et position GPS uniquement pour le traitement de vos commandes.',
        'Sécurité : Vos données sont stockées de manière sécurisée via notre infrastructure Supabase.',
        'Notifications : En installant l\'app, vous acceptez de recevoir des notifications liées au statut de vos commandes (FCM).'
      ]
    },
    {
      heading: '7. RESPONSABILITÉ ET PROPRIÉTÉ INTELLECTUELLE',
      paragraphs: [
        'Shop Good n\'est pas responsable des dommages indirects liés à l\'utilisation de l\'application ou à l\'indisponibilité du réseau internet.',
        'Tous les éléments de l\'application (logos, photos des plats, icônes) sont la propriété exclusive de Shop Good.'
      ]
    },
    {
      heading: '8. DROIT APPLICABLE',
      paragraphs: [
        'Les présentes conditions sont régies par les lois en vigueur en République de Madagascar. En cas de litige, une solution amiable sera privilégiée avant toute action devant les tribunaux d\'Antananarivo.'
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
