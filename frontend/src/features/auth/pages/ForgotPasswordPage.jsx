import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import AuthField from "../components/AuthField";
import { sendResetLink } from "../services/authClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await sendResetLink({ email });
      setSuccessMessage(`Reset instructions sent to ${email}.`);
    } catch (submitError) {
      setError(submitError.message || "Failed to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email and we will send a secure reset link."
      footer={
        <>
          <span>Remembered your password?</span>
          <Link to="/login" className="relative font-semibold text-campus-700 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:bg-campus-600 after:transition-transform after:duration-300 hover:text-campus-800 hover:after:origin-left hover:after:scale-x-100">
            Back to Login
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <AuthField
          id="forgot-email"
          name="email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
            setSuccessMessage("");
          }}
          placeholder="name@campus.edu"
          error={error}
          autoComplete="email"
        />

        {successMessage ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-campus-700" role="status">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(13,148,136,0.28)] transition duration-200 hover:scale-[1.01] hover:shadow-[0_16px_35px_rgba(37,99,235,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          <span className="inline-flex items-center gap-2">
            {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : null}
            {isSubmitting ? "Sending Link..." : "Send Reset Link"}
          </span>
        </button>

        <div className="flex justify-end">
          <Link to="/login" className="relative text-sm font-semibold text-campus-700 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:bg-campus-600 after:transition-transform after:duration-300 hover:text-campus-800 hover:after:origin-left hover:after:scale-x-100">
            Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
