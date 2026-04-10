import React from "react";

function RowSkeleton({ columns }) {
  return (
    <tr>
      {columns.map((col) => (
        <td key={col.key} className="px-3 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable({
  columns,
  rows,
  loading = false,
  emptyText = "No data available",
  rowKey = "id",
  className = "",
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/50 bg-white/70 ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-[15px]">
          <thead className="bg-slate-100/80 text-left text-[15px] font-semibold tracking-wide text-slate-700">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2.5 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <RowSkeleton columns={columns} />
                <RowSkeleton columns={columns} />
                <RowSkeleton columns={columns} />
              </>
            ) : rows.length > 0 ? (
              rows.map((row, index) => (
                <tr key={row[rowKey] || `${index}`} className="border-t border-slate-100 text-[15px] text-slate-700">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-3 align-top">
                      {col.render ? col.render(row, index) : row[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-[15px] text-slate-500">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
