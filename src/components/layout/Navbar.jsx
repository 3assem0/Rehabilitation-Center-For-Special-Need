import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp, useTranslation } from "../../context/AppContext";
import { LogOut, Languages, Menu } from "lucide-react";

const Navbar = ({ title }) => {
  const { logout, userData } = useAuth();
  const { state, dispatch } = useApp();
  const { language, t } = useTranslation();

  const toggleLanguage = () => {
    dispatch({ actionType: "SET_LANGUAGE", payload: language === "ar" ? "en" : "ar" });
  };

  return (
    <header
      style={{
        height: "60px",
        backgroundColor: "#F5F5F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: mobile menu + page title */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={() => dispatch({ actionType: "TOGGLE_SIDEBAR" })}
          style={{ padding: "6px", borderRadius: "8px", color: "#6B6B80", background: "transparent", border: "none", cursor: "pointer" }}
          className="menu-btn"
        >
          <Menu size={18} strokeWidth={1.75} />
        </button>
        <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#1a1a2e" }}>{title}</h2>
      </div>

      {/* Right: language toggle + user info + logout */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <button
          onClick={toggleLanguage}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "10px",
            backgroundColor: "#F0F0F6",
            border: "none",
            fontSize: "13px",
            fontWeight: 400,
            color: "#6B6B80",
            cursor: "pointer",
          }}
        >
          <Languages size={14} strokeWidth={1.75} />
          <span>{language === "ar" ? "English" : "العربية"}</span>
        </button>

        <div style={{ height: "20px", width: "0.5px", backgroundColor: "#E0E0E8" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ textAlign: "end" }} className="hidden sm:block">
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a2e", lineHeight: 1 }}>
              {userData?.name || t("admin")}
            </p>
            <p style={{ fontSize: "11px", color: "#9090A8", marginTop: "3px", textTransform: "uppercase" }}>
              {userData?.role || "admin"}
            </p>
          </div>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            backgroundColor: "#F0F0F6",
            border: "0.5px solid #E0E0E8",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
            fontSize: "13px", fontWeight: 500, color: "#1a1a2e"
          }}>
            {state.logo ? (
              <img src={state.logo} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              userData?.name?.charAt(0).toUpperCase() || "A"
            )}
          </div>

          <button
            onClick={logout}
            style={{ padding: "6px", borderRadius: "8px", color: "#9090A8", background: "transparent", border: "none", cursor: "pointer" }}
            title={t("logout")}
          >
            <LogOut size={16} strokeWidth={1.75} color="red"/>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
