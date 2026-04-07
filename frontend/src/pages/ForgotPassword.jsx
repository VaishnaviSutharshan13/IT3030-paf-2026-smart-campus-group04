import React from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <div className="auth-page">
      <section className="auth-card">
        <header className="auth-header">
          <h1>Forgot Password</h1>
          <p>Enter your email and we will send you a password reset link.</p>
        </header>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="forgot-email">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              className="auth-input"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-actions">
            <button type="submit" className="auth-button">
              Send Reset Link
            </button>
          </div>
        </form>

        <p className="auth-text auth-text-center">
          Back to{" "}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </p>
      </section>
    </div>
  );
}
