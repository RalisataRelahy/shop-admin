interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ size: number }>;
}

interface SidebarProps {
  items: NavItem[];
  active: string;
  onChange: (key: string) => void;
}
import './Sidebar.css';
export default function Sidebar({ items, active, onChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="dot" />
        <span className="logo-text">Admin</span>
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            className={`nav-item ${active === item.key ? "active" : ""}`}
            onClick={() => onChange(item.key)}
            aria-label={item.label}
          >
            <Icon size={16} />
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}