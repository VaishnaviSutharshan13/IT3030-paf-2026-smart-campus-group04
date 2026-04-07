import React from "react";
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unknown rendering error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="login-wrap">
          <section className="card login-form" style={{ width: "min(680px, 100%)" }}>
            <h1 style={{ margin: 0 }}>Smart Campus Operations Hub</h1>
            <p>The UI failed to render. Please refresh the page.</p>
            <p style={{ opacity: 0.8 }}>Details: {this.state.message}</p>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}
