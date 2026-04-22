import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useApp } from "../../context/AppContext";

const PageWrapper = ({ children, title }) => {
  const { state } = useApp();

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar className={state.isSidebarOpen ? "open" : ""} />
      <main 
        className="main-content"
        style={{ "--sidebar-offset": state.isSidebarOpen ? "260px" : "0px" }}
      >
        <Navbar title={title} />
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageWrapper;
