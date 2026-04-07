import React from "react";
export default function SectionCard({ title, children }) {
  return (
    <section className="card section-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
