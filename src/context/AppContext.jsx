import React, { createContext, useContext, useReducer, useEffect } from "react";
import { translations } from "../constants/translations";

const AppContext = createContext();

const initialState = {
  language: localStorage.getItem("lang") || "ar",
  isSidebarOpen: window.innerWidth > 1024,
  logo: localStorage.getItem("appLogo") || null,
};

function appReducer(state, action) {
  switch (action.actionType) {
    case "SET_LANGUAGE":
      localStorage.setItem("lang", action.payload);
      return { ...state, language: action.payload };
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case "SET_LOGO":
      if (action.payload) {
        localStorage.setItem("appLogo", action.payload);
      } else {
        localStorage.removeItem("appLogo");
      }
      return { ...state, logo: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = state.language;
  }, [state.language]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024 && state.isSidebarOpen) {
        dispatch({ actionType: "TOGGLE_SIDEBAR" });
      } else if (window.innerWidth > 1024 && !state.isSidebarOpen) {
        dispatch({ actionType: "TOGGLE_SIDEBAR" });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [state.isSidebarOpen]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

export function useTranslation() {
  const { state } = useApp();
  return {
    t: (key) => translations[state.language][key] || key,
    language: state.language,
  };
}
