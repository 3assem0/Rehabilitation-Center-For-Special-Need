import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp, useTranslation } from "../../context/AppContext";
import { LogOut, Languages, User, Menu } from "lucide-react";

const Navbar = ({ title }) => {
  const { logout, userData } = useAuth();
  const { state, dispatch } = useApp();
  const { language, t } = useTranslation();

  const toggleLanguage = () => {
    dispatch({ actionType: "SET_LANGUAGE", payload: language === "ar" ? "en" : "ar" });
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 sm:px-8 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => dispatch({ actionType: "TOGGLE_SIDEBAR" })}
          className="p-2 hover:bg-bg rounded-md menu-btn"
        >
          <Menu size={20} />
        </button>
        {state.logo && (
          <img src={state.logo} alt="Logo" className="h-8 w-auto object-contain block lg:hidden" />
        )}
        <h2 className="text-lg font-bold text-primary hidden sm:block">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg hover:bg-border transition-colors text-sm font-medium"
        >
          <Languages size={16} />
          <span>{language === "ar" ? "English" : "العربية"}</span>
        </button>

        <div className="h-8 w-[1px] bg-border"></div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold leading-none">{userData?.name || "مدير النظام"}</p>
            <p className="text-xs text-text-muted mt-1 uppercase">{userData?.role || "admin"}</p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-light text-white flex items-center justify-center font-bold">
            {userData?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          
          <button 
            onClick={logout}
            className="p-2 text-danger hover:bg-danger/10 rounded-md transition-colors"
            title={t("logout")}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
