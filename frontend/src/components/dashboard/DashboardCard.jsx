import React from "react";

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = "",
}) {
  return (
    <article className={`dashboard-glass-card p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-700">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <span className="dashboard-icon-wrap">
            <Icon size={18} />
          </span>
        ) : null}
      </div>

      {trend ? (
        <p className="mt-4 text-sm font-medium text-emerald-700">{trend}</p>
      ) : null}
    </article>
  );
}
