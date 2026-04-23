import React from "react";

/**
 * Shared inner-page layout wrapper.
 * Provides consistent background, padding, page title, and optional action buttons.
 *
 * Usage:
 *   <PageLayout title="Revenues" actions={<Button>Add</Button>}>
 *     ...content...
 *   </PageLayout>
 */
const PageLayout = ({ title, subtitle, actions, children }) => {
  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      background: "#F5F5F5",
      padding: "24px",
    }}>
      {/* Page header */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#1a1a2e", lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: "13px", color: "#9090A8", marginTop: "4px" }}>{subtitle}</p>
          )}
        </div>
        {actions && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div  style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
