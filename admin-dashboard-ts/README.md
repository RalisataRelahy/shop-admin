# Admin Dashboard (TypeScript) — Structure du projet

```
src/
├── App.tsx                   # Assemble la sidebar + la page active
├── types/
│   └── index.ts               # Types partagés : BaseItem, Column<T>, Field<T>, NavItem
├── styles/
│   └── theme.css              # Thème blanc / gris / vert pomme (#34C924)
├── components/
│   ├── Sidebar.tsx            # Menu de navigation à gauche
│   ├── CrudTable.tsx          # Composant générique typé : <CrudTable<T>>
│   └── Badges.tsx             # Badges réutilisables (statut, oui/non)
└── pages/
    ├── Dashboard.tsx           # Tableau de bord (cartes de stats)
    ├── Commandes.tsx           # CRUD Commandes
    ├── Categories.tsx          # CRUD Catégories
    ├── Promotions.tsx          # CRUD Promotions
    ├── Menu.tsx                 # CRUD Menu
    └── Clients.tsx              # CRUD Clients
```

## Typage

`CrudTable` est un composant générique : `CrudTable<T extends BaseItem>`.
Chaque page définit son propre type métier (ex. `Commande`, `Client`, `Produit`)
qui étend `BaseItem` (qui impose juste un champ `id: number`), puis déclare :

```ts
const columns: Column<Commande>[] = [...];
const fields: Field<Commande>[] = [...];
const initialData: Commande[] = [...];
```

et les passe à `<CrudTable<Commande> columns={columns} fields={fields} initialData={initialData} ... />`.

Cela donne l'auto-complétion et la vérification de types sur les clés (`key`)
des colonnes et des champs : impossible de référencer un champ qui n'existe pas
sur le type.

## Brancher une vraie API

Toute la logique CRUD (ajout, édition, suppression, recherche) est centralisée
dans `CrudTable.tsx`. Pour brancher une API, remplacez les `useState<T[]>`
par des appels `fetch`/`axios` typés (GET à l'ouverture, POST/PUT à la
soumission du formulaire, DELETE au clic sur la corbeille).

## Installation

```bash
npm install react lucide-react
npm install -D typescript @types/react @types/react-dom
```
