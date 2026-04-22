import React, { createContext, useContext, useReducer, useEffect } from "react";
import { translations } from "../constants/translations";

const AppContext = createContext();

const initialState = {
  language: localStorage.getItem("lang") || "ar",
  isSidebarOpen: true,
};

function appReducer(state, action) {
  switch (action.actionType) {
    case "SET_LANGUAGE":
      localStorage.setItem("lang", action.payload);
      return { ...state, language: action.payload };
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
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
