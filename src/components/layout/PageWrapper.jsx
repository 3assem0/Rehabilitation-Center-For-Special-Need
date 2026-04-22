import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useApp } from "../../context/AppContext";

const PageWrapper = ({ children, title }) => {
  const { state, dispatch } = useApp();

  return (
    <div className="min-h-screen bg-bg relative">
      {/* Mobile Overlay */}
      {state.isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[55] desktop-hidden backdrop-blur-sm transition-opacity"
          onClick={() => dispatch({ actionType: "TOGGLE_SIDEBAR" })}
        />
      )}

      <Sidebar className={state.isSidebarOpen ? "open" : ""} />
      
      <main 
        className="main-content"
        style={{ "--sidebar-offset": state.isSidebarOpen ? "260px" : "0px" }}
      >
        <Navbar title={title} />
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageWrapper;
