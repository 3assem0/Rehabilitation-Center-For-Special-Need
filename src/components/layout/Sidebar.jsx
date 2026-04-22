import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "../../context/AppContext";
import { 
  Home, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Wallet, 
  CreditCard, 
  BarChart2, 
  Bell, 
  Settings 
} from "lucide-react";

/**
 * Sidebar component refined for Admin-only access.
 * Uses robust Lucide icons compatible with v1.8.0+.
 */
const Sidebar = ({ className = "" }) => {
  const { t, language } = useTranslation();

  const menuItems = [
    { name: t("dashboard"), path: "/", icon: <Home size={20} /> },
    { name: t("revenues"), path: "/revenues", icon: <TrendingUp size={20} /> },
    { name: t("expenses"), path: "/expenses", icon: <TrendingDown size={20} /> },
    { name: t("employees"), path: "/employees", icon: <Users size={20} /> },
    { name: t("attendance"), path: "/attendance", icon: <Clock size={20} /> },
    { name: t("payroll"), path: "/payroll", icon: <DollarSign size={20} /> },
    { name: t("pettyCash"), path: "/petty-cash", icon: <Wallet size={20} /> },
    { name: t("payments"), path: "/payments", icon: <CreditCard size={20} /> },
    { name: t("reports"), path: "/reports", icon: <BarChart2 size={20} /> },
    { name: t("alerts"), path: "/alerts", icon: <Bell size={20} /> },
    { name: t("settings"), path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside className={`fixed top-0 bottom-0 w-[260px] bg-sidebar text-sidebar-text shadow-xl overflow-y-auto z-[60] ${className}`}>
      <div className="p-6 text-center border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">
          {language === "ar" ? "مركز التأهيل" : "Rehab Center"}
        </h1>
        <p className="text-xs text-sidebar-text/50 mt-1 uppercase tracking-wider">Accounting System</p>
      </div>

      <nav className="mt-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive 
                ? "bg-primary-light text-white shadow-lg" 
                : "hover:bg-white/5 text-sidebar-text/70 hover:text-white"}
            `}
          >
            {item.icon}
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
