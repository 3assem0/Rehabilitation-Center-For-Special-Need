import React, { useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "../../context/AppContext";

/**
 * @param {Array} columns [{ header: 'Name', key: 'name', render: (val, row) => <span>{val}</span> }]
 * @param {Array} data
 * @param {string} searchPlaceholder
 */
const DataTable = ({ columns, data, searchPlaceholder, onSearch, onRowClick }) => {
  const { t } = useTranslation();
  const placeholder = searchPlaceholder || t("search") || "Search...";

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "14px",
      border: "0.5px solid #E8E8EC",
      overflow: "hidden",
    }}>
      {/* Search Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "0.5px solid #E8E8EC",
        background: "#FAFAFA",
      }}>
        <div style={{ position: "relative", maxWidth: "320px" }}>
          <Search
            size={15}
            strokeWidth={1.75}
            color="#9090A8"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder={placeholder}
            onChange={(e) => onSearch && onSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              background: "#F0F0F6",
              border: "none",
              borderRadius: "20px",
              fontSize: "13px",
              color: "#1a1a2e",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
          <thead>
            <tr style={{ background: "#FAFAFA", borderBottom: "0.5px solid #E8E8EC" }}>
              {columns.map((col) => (
                <th key={col.key} style={{
                  padding: "11px 20px",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#9090A8",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  whiteSpace: "nowrap",
                }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{
                    borderBottom: "0.5px solid #F0F0F4",
                    cursor: onRowClick ? "pointer" : "default",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{
                      padding: "13px 20px",
                      fontSize: "13px",
                      color: "#1a1a2e",
                      whiteSpace: "nowrap",
                    }}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "32px" }}>📭</span>
                    <p style={{ fontSize: "14px", color: "#9090A8" }}>{t("noData") || "لا توجد بيانات متاحة حالياً"}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
