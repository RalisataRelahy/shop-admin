import { useMemo, useState } from 'react';
import './LegalDocumentsPage.css';

type LegalTab = 'privacy' | 'terms' | 'license';

const legalContent: Record<
  LegalTab,
  {
    title: string;
    summary: string;
    lastUpdated: string;
    paragraphs: Array<{ heading: string; body: string[] }>;
  }
> = {
  privacy: {
    title: 'Politique de confidentialité',
    summary:
      'Cette politique décrit comment les données des utilisateurs sont collectées, utilisées et protégées dans l’application et son environnement web associé.',
    lastUpdated: 'Dernière mise à jour : 16 août 2026',
    paragraphs: [
      {
        heading: '1. Données collectées',
        body: [
          'Nous collectons les informations nécessaires au fonctionnement de l’application, notamment les informations de compte, les coordonnées de contact, les commandes et les données techniques de navigation ou d’utilisation. Cela inclut notamment les noms, numéros de téléphone, adresses de livraison, préférences de commande et données de session nécessaires à la sécurité et au bon fonctionnement du service.',
          'Nous pouvons également collecter des données d’usage anonymisées pour améliorer la performance, la stabilité, la sécurité de l’application et la qualité du service offert.'
        ]
      },
      {
        heading: '2. Utilisation des données',
        body: [
          'Les données sont utilisées pour traiter les commandes, gérer les comptes utilisateurs, faciliter la communication, sécuriser le système et améliorer l’expérience client.',
          'Les données ne sont pas vendues à des tiers. Elles peuvent être partagées uniquement avec des prestataires techniques strictement nécessaires au fonctionnement du service, dans le respect de la confidentialité et de la sécurité des données.'
        ]
      },
      {
        heading: '3. Sécurité',
        body: [
          'Nous mettons en place des mesures de sécurité raisonnables pour protéger les informations personnelles contre l’accès non autorisé, la modification, la divulgation ou la destruction.',
          'Toutefois, aucun système de transmission ou de stockage numérique ne peut être garanti à 100 % sûr. Nous faisons notre maximum pour minimiser les risques et réagir rapidement à toute anomalie détectée.'
        ]
      },
      {
        heading: '4. Conservation',
        body: [
          'Les données sont conservées le temps nécessaire à l’exécution du service, à la gestion des obligations légales et à l’amélioration de l’expérience utilisateur.',
          'Vous pouvez demander la suppression ou la mise à jour de certaines informations en nous contactant via les moyens mis à disposition dans l’application ou sur le site web.'
        ]
      },
      {
        heading: '5. Droits de l’utilisateur',
        body: [
          'Selon le cadre légal applicable, vous pouvez demander l’accès, la rectification, la limitation ou la suppression de vos données personnelles.',
          'Pour toute demande concernant votre vie privée, vous pouvez nous contacter via le support de l’application ou par le biais des coordonnées fournies dans les mentions légales du site.'
        ]
      }
    ]
  },
  terms: {
    title: 'Conditions d’utilisation',
    summary:
      'Ces conditions définissent les règles d’utilisation de l’application et de son environnement web associé. Elles doivent être acceptées par l’utilisateur avant toute utilisation du service.',
    lastUpdated: 'Dernière mise à jour : 16 août 2026',
    paragraphs: [
      {
        heading: '1. Objet du service',
        body: [
          'L’application vise à permettre la commande, la gestion et le suivi des produits, services, commandes et demandes de rappel dans le cadre d’un service de restauration ou de vente en ligne.',
          'L’utilisateur s’engage à utiliser le service conformément à la finalité prévue et à respecter les règles applicables en matière de consommation, de sécurité et de propriété intellectuelle.'
        ]
      },
      {
        heading: '2. Compte utilisateur',
        body: [
          'L’accès à certaines fonctionnalités nécessite la création d’un compte. L’utilisateur est responsable de la véracité des informations fournies et de la confidentialité de ses identifiants.',
          'Nous pouvons suspendre ou fermer un compte en cas d’usage frauduleux, abusif ou non conforme aux présentes conditions.'
        ]
      },
      {
        heading: '3. Commandes et paiements',
        body: [
          'Les commandes passées via l’application sont soumises à la disponibilité des produits et services, aux conditions de livraison ou de retrait et aux règles commerciales applicables.',
          'Les renseignements sur les prix, promotions, délais et disponibilités peuvent être modifiés sans préavis, dans le cadre de la gestion commerciale du service.'
        ]
      },
      {
        heading: '4. Responsabilité',
        body: [
          'L’application est fournie “tel quel”, sans garantie absolue de disponibilité continue ou de performance sans interruption.',
          'Nous nous efforçons d’assurer la fiabilité du service, mais nous ne pouvons pas garantir l’absence totale d’erreurs techniques, de bugs ou de perturbations temporaires.'
        ]
      },
      {
        heading: '5. Modifications',
        body: [
          'Nous pouvons modifier ces conditions à tout moment afin de les adapter aux évolutions du service, de la réglementation ou de l’expérience utilisateur.',
          'Les modifications importantes seront communiquées dans l’application ou via les moyens de contact disponibles. L’utilisation continue du service vaut acceptation des nouvelles conditions.'
        ]
      }
    ]
  },
  license: {
    title: 'Licence open source',
    summary:
      'Cette section présente une licence-type pour les composants open source utilisés dans l’application et la documentation associée. Elle vise à clarifier les droits et obligations liés aux éléments partagés sous licence open source.',
    lastUpdated: 'Dernière mise à jour : 16 août 2026',
    paragraphs: [
      {
        heading: '1. Objet de la licence',
        body: [
          'La présente licence couvre les éléments logiciels, scripts, composants ou ressources qui sont mis à disposition en open source dans le cadre de ce projet ou de ses modules associés.',
          'Le code et les assets peuvent être réutilisés conformément aux termes de la licence applicable, sous réserve de respecter les conditions de redistribution et de mention des droits d’auteur.'
        ]
      },
      {
        heading: '2. Conditions d’utilisation',
        body: [
          'Toute reproduction, modification, distribution ou utilisation du code sous licence doit respecter les obligations de la licence choisie et les conditions de mention des auteurs originaux.',
          'L’utilisateur s’engage à conserver les notices de licence, les informations de propriété intellectuelle et les avertissements de garantie dans les copies ou dérivés du projet.'
        ]
      },
      {
        heading: '3. Licence de référence',
        body: [
          'Nous recommandons l’utilisation d’une licence permissive telle que la MIT License, ou d’une licence copyleft selon les besoins du projet et les obligations de contribution.',
          'Exemple de référence : la MIT License autorise la libre utilisation, modification et redistribution du code, sous réserve de conserver l’avertissement de copyright et la licence associée.'
        ]
      },
      {
        heading: '4. Aucune garantie',
        body: [
          'Le logiciel est fourni “tel quel”, sans garantie explicite ou implicite de qualité, de performance, de conformité ou de disponibilité.',
          'Les contributeurs et les distributeurs ne peuvent être tenus responsables des dommages directs ou indirects découlant de l’utilisation ou de la mauvaise utilisation du logiciel.'
        ]
      },
      {
        heading: '5. Déclaration de conformité',
        body: [
          'Les composants open source intégrés doivent être documentés et leurs licences respectées dans le dépôt ou la documentation du projet.',
          'Toute dépendance tierce utilisée par l’application doit être identifiable et compatible avec les exigences de distribution et de conformité du projet.'
        ]
      }
    ]
  }
};

export default function LegalDocumentsPage() {
  const [activeTab, setActiveTab] = useState<LegalTab>('privacy');

  const selected = useMemo(() => legalContent[activeTab], [activeTab]);

  return (
    <div className="legal-page">
      <header className="legal-header">
        <span className="legal-kicker">Informations légales</span>
        <h1>Documents juridiques</h1>
        <p>
          Cette section regroupe les informations essentielles relatives à la confidentialité,
          aux conditions d’utilisation et à la licence open source de l’application.
        </p>
      </header>

      <nav className="legal-tabs" aria-label="Documents légaux">
        <button
          type="button"
          className={`legal-tab ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          Politique de confidentialité
        </button>
        <button
          type="button"
          className={`legal-tab ${activeTab === 'terms' ? 'active' : ''}`}
          onClick={() => setActiveTab('terms')}
        >
          Conditions d’utilisation
        </button>
        <button
          type="button"
          className={`legal-tab ${activeTab === 'license' ? 'active' : ''}`}
          onClick={() => setActiveTab('license')}
        >
          Licence open source
        </button>
      </nav>

      <article className="legal-card">
        <h2>{selected.title}</h2>
        <p className="legal-summary">{selected.summary}</p>
        <div className="legal-meta">{selected.lastUpdated}</div>

        {selected.paragraphs.map((section) => (
          <section key={section.heading} className="legal-section">
            <h3>{section.heading}</h3>
            {section.body.map((paragraph, index) => (
              <p key={`${section.heading}-${index}`}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
