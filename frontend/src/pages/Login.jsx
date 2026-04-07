import React from "react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="auth-page">
      <section className="auth-card">
        <header className="auth-header">
          <h1>Sign In</h1>
          <p>Welcome back. Continue to your workspace.</p>
        </header>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="auth-input"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="auth-input"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="auth-actions">
            <button type="submit" className="auth-button">
              Login
            </button>
          </div>
        </form>

        <div className="auth-links-row">
          <Link to="/forgot-password" className="auth-link" aria-label="Forgot your password">
            Forgot Password?
          </Link>
          <p className="auth-text">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="auth-link">
              Register
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
