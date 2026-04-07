import React from "react";
export default function EmptyState({ title, subtitle }) {
  return (
    <section className="empty-state">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </section>
  );
}
