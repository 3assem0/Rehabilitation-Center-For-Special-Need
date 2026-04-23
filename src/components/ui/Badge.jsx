import React from "react";

const Badge = ({ children, variant = "gray", className = "" }) => {
  const variants = {
    green:  { background: "#DCFCE7", color: "#16A34A" },
    red:    { background: "#FEE2E2", color: "#DC2626" },
    yellow: { background: "#FEF9C3", color: "#CA8A04" },
    blue:   { background: "#EEF2FF", color: "#4F46E5" },
    gray:   { background: "#F0F0F6", color: "#6B6B80" },
    orange: { background: "#FED7AA", color: "#9A3412" },
    lime:   { background: "#BEF264", color: "#3F6212" },
  };

  const s = variants[variant] || variants.gray;

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 9px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...s,
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
