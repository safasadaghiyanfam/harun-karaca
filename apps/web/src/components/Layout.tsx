import { NavLink } from "react-router-dom";
import { BarChart3, Boxes, ClipboardCheck, FileText, Fuel, Gauge, LogOut, ShieldCheck, Store, Users, WalletCards } from "lucide-react";
import { Role, useAuth } from "../auth/AuthContext";

const items: Array<{ to: string; label: string; icon: React.ReactNode; roles: Role[] }> = [
  { to: "/", label: "Dashboard", icon: <Gauge size={18} />, roles: ["ADMIN", "MANAGER", "CASHIER", "INVENTORY", "ACCOUNTING", "TECHNICIAN"] },
  { to: "/sales", label: "Satis", icon: <WalletCards size={18} />, roles: ["ADMIN", "MANAGER", "CASHIER"] },
  { to: "/inventory", label: "Stok", icon: <Boxes size={18} />, roles: ["ADMIN", "MANAGER", "INVENTORY"] },
  { to: "/shifts", label: "Vardiya", icon: <ClipboardCheck size={18} />, roles: ["ADMIN", "MANAGER", "CASHIER"] },
  { to: "/stations", label: "Istasyon", icon: <Store size={18} />, roles: ["ADMIN", "MANAGER", "TECHNICIAN"] },
  { to: "/pumps", label: "Pompa", icon: <Fuel size={18} />, roles: ["ADMIN", "MANAGER", "TECHNICIAN"] },
  { to: "/reports", label: "Rapor", icon: <BarChart3 size={18} />, roles: ["ADMIN", "MANAGER", "ACCOUNTING"] },
  { to: "/fiscal", label: "Mali Operasyonlar", icon: <FileText size={18} />, roles: ["ADMIN", "MANAGER", "ACCOUNTING"] },
  { to: "/validation", label: "Dogrulama", icon: <ShieldCheck size={18} />, roles: ["ADMIN", "MANAGER", "TECHNICIAN"] },
  { to: "/users", label: "Kullanicilar", icon: <Users size={18} />, roles: ["ADMIN", "MANAGER"] }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const visibleItems = items.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">HK</span>
          <div>
            <strong>Harun Karaca</strong>
            <small>Muhasebe ve E-Donusum Platformu</small>
          </div>
        </div>
        <div className="nav-label">Moduller</div>
        <nav>
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              {item.icon}<span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main>
        <header className="topbar">
          <div className="topbar-copy">
            <strong>Merkez Kontrol Paneli</strong>
            <small>Muhasebe, e-donusum ve mali entegrasyon izleme</small>
          </div>
          <div className="user-strip">
            <span className="user-avatar">{user?.name?.slice(0, 1) ?? "U"}</span>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </div>
            <button className="icon-button secondary" onClick={logout} title="Cikis">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
