import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Tag,
  Percent,
  UtensilsCrossed,
  Users,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import Dashboard from "../../src/features/dashboards/views/Dashboard";
import Commandes from "./pages/Commandes";
import Categories from "./pages/Categories";
import Promotions from "./pages/Promotions";
import Menu from "./pages/Menu";
import Clients from "./pages/Clients";
import type { NavItem } from "../../src/types";

import "./styles/theme.css";

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, component: Dashboard },
  { key: "commandes", label: "Commandes", icon: ShoppingCart, component: Commandes },
  { key: "categories", label: "Catégories", icon: Tag, component: Categories },
  { key: "promotions", label: "Promotions", icon: Percent, component: Promotions },
  { key: "menu", label: "Menu", icon: UtensilsCrossed, component: Menu },
  { key: "clients", label: "Clients", icon: Users, component: Clients },
];

export default function App() {
  const [active, setActive] = useState<string>("dashboard");
  const ActiveComponent = NAV_ITEMS.find((n) => n.key === active)!.component;

  return (
    <div className="app">
      <Sidebar items={NAV_ITEMS} active={active} onChange={setActive} />
      <main className="main">
        <ActiveComponent />
      </main>
    </div>
  );
}
