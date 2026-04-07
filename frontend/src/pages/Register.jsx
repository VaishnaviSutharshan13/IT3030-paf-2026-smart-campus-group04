import React from "react";
import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="auth-page">
      <section className="auth-card">
        <header className="auth-header">
          <h1>Sign Up</h1>
          <p>Create your account to access the platform.</p>
        </header>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-name">
              Full Name
            </label>
            <input
              id="register-name"
              type="text"
              className="auth-input"
              placeholder="Jane Doe"
              autoComplete="name"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              className="auth-input"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              className="auth-input"
              placeholder="Create a strong password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-confirm-password">
              Confirm Password
            </label>
            <input
              id="register-confirm-password"
              type="password"
              className="auth-input"
              placeholder="Confirm password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="auth-actions">
            <button type="submit" className="auth-button">
              Register
            </button>
          </div>
        </form>

        <p className="auth-text auth-text-center">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </p>
      </section>
    </div>
  );
}
