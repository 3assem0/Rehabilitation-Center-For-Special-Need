import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const KPICard = ({ title, value, icon, trend, trendValue, color = "primary" }) => {
  const iconColors = {
    primary: { bg: "#FFF5F3", color: "#E85C3A" },
    success: { bg: "#F0FDF6", color: "#22A86E" },
    danger:  { bg: "#FFF5F3", color: "#E85C3A" },
    warning: { bg: "#FFFBEB", color: "#F59E0B" },
  };

  const ic = iconColors[color] || iconColors.primary;

  return (
    <div style={{
      backgroundColor: "#ffffff",
      borderRadius: "14px",
      border: "0.5px solid #E0E0E8",
      padding: "1.25rem 1.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 500, color: "#9090A8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            {title}
          </p>
          <h3 style={{ fontSize: "26px", fontWeight: 500, color: "#1a1a2e", lineHeight: 1.1 }}>
            {value}
          </h3>

          {trend && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px", fontSize: "12px", color: trend === "up" ? "#22A86E" : "#E85C3A" }}>
              {trend === "up" ? <ArrowUpRight size={13} strokeWidth={1.75} /> : <ArrowDownRight size={13} strokeWidth={1.75} />}
              <span style={{ fontWeight: 500 }}>{trendValue}</span>
              <span style={{ color: "#9090A8", fontWeight: 400, marginLeft: "2px" }}>مقابل الشهر الماضي</span>
            </div>
          )}
        </div>
        <div style={{
          padding: "10px",
          borderRadius: "10px",
          backgroundColor: ic.bg,
          color: ic.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default KPICard;

