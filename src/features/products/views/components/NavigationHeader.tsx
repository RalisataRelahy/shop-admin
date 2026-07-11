import { LayoutGrid, Plus, PackagePlus } from "lucide-react";
import "./NavigationHeader.css";

export type ProductsPage = "dashboard" | "add-menu" | "add-combo";

interface NavigationHeaderProps {
  activePage: ProductsPage;
  onNavigate: (page: ProductsPage) => void;
}

const NAV_ITEMS: { page: ProductsPage; label: string; icon: React.ReactNode }[] = [
  { page: "dashboard", label: "Menus & Combos", icon: <LayoutGrid size={16} /> },
  { page: "add-menu", label: "Ajouter un menu", icon: <Plus size={16} /> },
  { page: "add-combo", label: "Ajouter un pack combo", icon: <PackagePlus size={16} /> },
];

export default function NavigationHeader({ activePage, onNavigate }: NavigationHeaderProps) {
  return (
    <nav className="nav-header">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.page}
          type="button"
          className={`nav-tab ${activePage === item.page ? "active" : ""}`}
          onClick={() => onNavigate(item.page)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}