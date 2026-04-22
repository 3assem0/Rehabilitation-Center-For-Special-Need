import React from "react";
import { TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

const KPICard = ({ title, value, icon, trend, trendValue, color = "primary" }) => {
  const colors = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    danger: "text-danger bg-danger/10",
    warning: "text-warning bg-warning/10",
  };

  return (
    <div className="card group hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-2xl font-black text-text">{value}</h3>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
              {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trendValue}</span>
              <span className="text-text-muted font-normal ml-1">مقابل الشهر الماضي</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
