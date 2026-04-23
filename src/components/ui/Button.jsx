import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  ...props
}) => {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontFamily: "inherit",
    fontWeight: 500,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.65 : 1,
    border: "none",
    transition: "background 0.15s, opacity 0.15s",
  };

  const variants = {
    primary:   { background: "#1a1a2e", color: "#ffffff", borderRadius: "20px" },
    secondary: { background: "transparent", color: "#1a1a2e", border: "0.5px solid #E8E8EC", borderRadius: "20px" },
    danger:    { background: "#FEE2E2", color: "#DC2626", borderRadius: "20px" },
    success:   { background: "#DCFCE7", color: "#16A34A", borderRadius: "20px" },
    warning:   { background: "#FEF9C3", color: "#CA8A04", borderRadius: "20px" },
    ghost:     { background: "transparent", color: "#6B6B80", borderRadius: "8px" },
  };

  const sizes = {
    sm: { padding: "5px 14px", fontSize: "12px" },
    md: { padding: "8px 18px", fontSize: "13px" },
    lg: { padding: "10px 24px", fontSize: "14px" },
  };

  return (
    <button
      style={{ ...base, ...variants[variant], ...sizes[size] }}
      disabled={loading}
      className={className}
      {...props}
    >
      {loading && (
        <div style={{
          width: "13px", height: "13px",
          border: "2px solid currentColor",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.6s linear infinite",
        }} />
      )}
      {children}
    </button>
  );
};

export default Button;
