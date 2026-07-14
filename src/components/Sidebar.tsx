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

export default function Sidebar({ items, active, onChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="dot" />
        Admin
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            className={`nav-item ${active === item.key ? "active" : ""}`}
            onClick={() => onChange(item.key)}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </aside>
  );
}
