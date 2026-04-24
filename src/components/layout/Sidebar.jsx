import React, { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation, useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useFirestore } from "../../hooks/useFirestore";
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
  Settings,
  Search,
  MoreHorizontal,
  Layers,
  LogOut
} from "lucide-react";
import { differenceInDays, format } from "date-fns";

/**
 * Sidebar component refined for Admin-only access.
 * Uses robust Lucide icons compatible with v1.8.0+.
 */
const Sidebar = ({ className = "" }) => {
  const { t, language } = useTranslation();
  const { state, dispatch } = useApp();
  const { userData, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // ── Real alerts count from Firestore ─────────────────────────────
  const { data: revenues } = useFirestore("revenues");
  const { data: employees } = useFirestore("employees");
  const { data: payroll } = useFirestore("payroll");
  const { data: transactions } = useFirestore("petty_cash");

  const alertsCount = useMemo(() => {
    const now = new Date();
    let count = 0;

    // Load dismissed alerts from localStorage
    let dismissed = {};
    try {
      const stored = localStorage.getItem("dismissed_alerts");
      if (stored) dismissed = JSON.parse(stored);
    } catch (e) {}

    const isDismissed = (id) => {
      const timestamp = dismissed[id];
      if (!timestamp) return false;
      return (Date.now() - timestamp) < 86400000; // 24 hours
    };

    // 1. Overdue revenues (> 30 days, unpaid)
    revenues.forEach(rev => {
      if (rev.paymentStatus === "paid") return;
      const d = rev.date?.toDate ? rev.date.toDate() : new Date(rev.date);
      if (differenceInDays(now, d) > 30) {
        if (!isDismissed(`rev-${rev.id}`)) count++;
      }
    });

    // 2. Unpaid salaries this month
    const monthKey = format(now, "yyyy-MM");
    employees.filter(e => e.isActive).forEach(emp => {
      const isPaid = payroll.find(p => p.employeeId === emp.id && p.month === monthKey && p.paymentStatus === 'paid');
      if (!isPaid) {
        if (!isDismissed(`sal-${emp.id}-${monthKey}`)) count++;
      }
    });

    return count;
  }, [revenues, employees, payroll]);

  const toggleLanguage = () => {
    dispatch({ actionType: "SET_LANGUAGE", payload: language === "ar" ? "en" : "ar" });
  };

  // ── Nav items split into two sections ────────────────────────────
  const mainItems = [
    { name: t("dashboard"),  path: "/",           icon: <Home       size={18} strokeWidth={1.75} /> },
    { name: t("revenues"),   path: "/revenues",   icon: <TrendingUp size={18} strokeWidth={1.75} /> },
    { name: t("expenses"),   path: "/expenses",   icon: <TrendingDown size={18} strokeWidth={1.75} /> },
    { name: t("employees"),  path: "/employees",  icon: <Users      size={18} strokeWidth={1.75} /> },
    { name: t("attendance"), path: "/attendance", icon: <Clock      size={18} strokeWidth={1.75} /> },
    { name: t("payroll"),    path: "/payroll",    icon: <DollarSign size={18} strokeWidth={1.75} /> },
    { name: t("pettyCash"),  path: "/petty-cash", icon: <Wallet     size={18} strokeWidth={1.75} /> },
    { name: t("payments"),   path: "/payments",   icon: <CreditCard size={18} strokeWidth={1.75} /> },
    { name: t("reports"),    path: "/reports",    icon: <BarChart2  size={18} strokeWidth={1.75} /> },
  ];

  const accountItems = [
    {
      name: t("alerts") || "Notifications",
      path: "/alerts",
      icon: <Bell size={18} strokeWidth={1.75} />,
      badge: alertsCount > 0 ? { label: String(alertsCount), bg: "#BEF264", color: "#3F6212" } : null,
    },
    {
      name: t("settings") || "Settings",
      path: "/settings",
      icon: <Settings size={18} strokeWidth={1.75} />,
    },
  ];

  const filteredMainItems = mainItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredAccountItems = accountItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Reusable nav row ─────────────────────────────────────────────
  const NavRow = ({ item }) => (
    <NavLink
      to={item.path}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        height: "36px",
        padding: "0 10px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: isActive ? 500 : 400,
        color: isActive ? "#1a1a2e" : "#6B6B80",
        textDecoration: "none",
        transition: "background 0.12s",
        background: "transparent",
      })}
      onMouseEnter={e => e.currentTarget.style.background = "#F5F5F8"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {item.icon}
        {item.name}
      </span>
      {item.badge && (
        <span style={{
          background: item.badge.bg,
          color: item.badge.color,
          fontSize: "11px",
          fontWeight: 500,
          padding: "2px 7px",
          borderRadius: "20px",
          lineHeight: 1.4,
          whiteSpace: "nowrap",
        }}>
          {item.badge.label}
        </span>
      )}
    </NavLink>
  );

  // ── Sidebar panel ────────────────────────────────────────────────
  return (
       <aside
      className={`sidebar z-[60] ${className}`}
    
      style={{
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        padding: "20px 16px",
        overflowY: "auto",
        borderRadius:"15px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      }}
    >
      {/* ── TOP: Logo + Search ── */}
      <div className="pb-2" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
        {isSearchActive ? (
          <div style={{ display: "flex", alignItems: "center", width: "100%", background: "#F0F0F6", borderRadius: "8px", padding: "4px 8px" }}>
            <Search size={14} color="#9090A8" />
            <input 
              autoFocus
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={language === "ar" ? "بحث..." : "Search..."}
              style={{ border: "none", background: "transparent", outline: "none", padding: "4px 8px", fontSize: "13px", width: "100%", color: "#1a1a2e" }}
            />
            <button onClick={() => { setIsSearchActive(false); setSearchQuery(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6B80", padding: "0" }}>
              <span style={{ fontSize: "16px", lineHeight: 1 }}>&times;</span>
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {state.logo ? (
                <img src={state.logo} alt="Logo" style={{ width: "22px", height: "22px", objectFit: "contain" }} />
              ) : (
                <Layers size={20} strokeWidth={2} color="#1a1a2e" />
              )}
              <div style={{ lineHeight: 1.2 }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "0.02em" }}>
                  {language === "ar" ? "مركز التأهيل" : "Rehab Center"}
                </span>
                <span style={{ fontSize: "11px", color: "#9090A8", margin: "5px" }}>v1.2</span>
              </div>
            </div>
            <button 
              onClick={() => setIsSearchActive(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6B80", padding: "2px", display: "flex" }}
            >
              <Search size={18} strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>

      {/* ── TOGGLE: Language ── */}
      {/* <div className="w-full flex items-center justify-center">
        <div style={{
        display: "flex",
        background: "#F0F0F6",
        borderRadius: "10px",
        width: "70%",
        padding: "4px",
        marginBottom: "20px",
        gap: "4px",
      }}>
        <button
          onClick={() => language !== "en" && toggleLanguage()}
          style={{
            flex: 1,
            padding: "3px 0",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            transition: "background 0.15s",
            background: language === "en" ? "#2563EB" : "transparent",
            color: language === "en" ? "#ffffff" : "#6B6B80",
          }}
        >
          English
        </button>
        <button
          onClick={() => language !== "ar" && toggleLanguage()}
          style={{
            flex: 1,
            padding: "3px 0",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            transition: "background 0.15s",
            background: language === "ar" ? "#2563EB" : "transparent",
            color: language === "ar" ? "#ffffff" : "#6B6B80",
          }}
        >
          العربية
        </button>
      </div>
      </div> */}

      {/* ── MAIN NAV ── */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
        {mainItems.map(item => <NavRow key={item.path} item={item} />)}

        {/* ── ACCOUNT SECTION DIVIDER ── */}
        <div style={{
          fontSize: "10px",
          fontWeight: 500,
          color: "#9090A8",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginTop: "20px",
          marginBottom: "6px",
          paddingLeft: "10px",
        }}>
          {t("account") || "Account"}
        </div>

        {accountItems.map(item => <NavRow key={item.path} item={item} />)}
      </nav>

      {/* ── BOTTOM USER CARD ── */}
      <div style={{
        marginTop: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        // background: "#F5F5F8",
        // borderRadius: "40px",
        padding: "8px 12px",
        gap: "10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", overflow: "hidden" }}>
          <div style={{
            width: "36px", height: "36px",
            borderRadius: "50%",
            background: "#E0E0E8",
            flexShrink: 0,
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 500, color: "#1a1a2e",
          }}>
            {state.logo
              ? <img src={state.logo} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (userData?.name?.charAt(0).toUpperCase() || "A")
            }
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userData?.name || "Admin"}
            </p>
            <p style={{ fontSize: "11px", color: "#9090A8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "1px" }}>
              admin@help.com
            </p>
          </div>
        </div>
        <button 
          onClick={logout}
          title="تسجيل الخروج"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9090A8", padding: "4px", flexShrink: 0, display: "flex", borderRadius: "6px", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#FEE2E2"; e.currentTarget.style.color = "#DC2626"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#9090A8"; }}
        >
          <LogOut size={16} strokeWidth={2} />
        </button>
      </div>
    </aside>
   
  );
};

export default Sidebar;
