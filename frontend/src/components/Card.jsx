import React from "react";

export default function Card({ title, children, className = "", actions }) {
  return (
    <section className={`card ui-card ${className}`.trim()}>
      {(title || actions) && (
        <header className="ui-card-header">
          {title ? <h2>{title}</h2> : <span />}
          {actions ? <div className="ui-card-actions">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}
