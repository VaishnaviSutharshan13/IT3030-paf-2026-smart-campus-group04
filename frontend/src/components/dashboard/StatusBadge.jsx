import React from "react";

const variants = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  active: "bg-cyan-100 text-cyan-800 border-cyan-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  maintenance: "bg-orange-100 text-orange-800 border-orange-200",
  open: "bg-indigo-100 text-indigo-800 border-indigo-200",
  assigned: "bg-sky-100 text-sky-800 border-sky-200",
  in_progress: "bg-violet-100 text-violet-800 border-violet-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  default: "bg-slate-100 text-slate-700 border-slate-200",
};

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

export default function StatusBadge({ status, label }) {
  const normalized = normalizeStatus(status || label);
  const key = variants[normalized] ? normalized : "default";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${variants[key]}`}
    >
      {label || String(status || "Unknown")}
    </span>
  );
}
