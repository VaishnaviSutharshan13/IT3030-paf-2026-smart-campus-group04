import React from "react";
export default function KpiCard({ label, value }) {
  return (
    <article className="card kpi-card">
      <p className="kpi-label">{label}</p>
      <strong className="kpi-value">{value}</strong>
    </article>
  );
}
