import React from "react";
import { Search } from "lucide-react";

/**
 * @param {Array} columns [{ header: 'Name', key: 'name', render: (val, row) => <span>{val}</span> }]
 * @param {Array} data
 * @param {string} searchPlaceholder
 */
const DataTable = ({ columns, data, searchPlaceholder = "Search...", onSearch, onRowClick }) => {
  return (
    <div className="card !p-0 overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-border bg-bg/20 flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            className="input pl-10"
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-bg text-primary border-b border-border">
              {columns.map((col) => (
                <th key={col.key} className="px-4 sm:px-6 py-4 text-sm font-bold whitespace-nowrap first:rounded-tr-lg last:rounded-tl-lg">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  className={`hover:bg-bg/50 transition-colors group ${onRowClick ? 'cursor-pointer hover:bg-primary/5' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 sm:px-6 py-4 text-sm text-text whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl text-border">📭</span>
                    <p className="font-medium">لا توجد بيانات متاحة حالياً</p>
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
