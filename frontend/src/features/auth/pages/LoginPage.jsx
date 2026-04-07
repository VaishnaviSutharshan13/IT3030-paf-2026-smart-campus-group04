import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import AuthField from "../components/AuthField";
import { loginWithEmail } from "../services/authClient";
import { useAuth } from "../context/AuthContext";
import useAuthRedirect from "../hooks/useAuthRedirect";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const roleHome = {
  super_admin: "/admin-dashboard",
  student: "/student-dashboard",
  lecturer: "/lecturer-dashboard",
  admin: "/admin-dashboard",
  technician: "/technician-dashboard",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const redirectPath = useAuthRedirect();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const canSubmit = useMemo(
    () => form.email.trim().length > 0 && form.password.trim().length > 0,
    [form.email, form.password]
  );

  function validate(values) {
    const nextErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(values.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (values.password.length < 6) {
      nextErrors.password = "Password must contain at least 6 characters.";
    }

    return nextErrors;
  }

  function onChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    try {
      const auth = await loginWithEmail(form);
      const user = login(auth);
      toast.success(auth.message || "Login successful.");
      navigate(redirectPath ?? roleHome[user.role], { replace: true });
    } catch (error) {
      const message = error.message || "Unable to log in with provided credentials.";
      setApiError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue managing your smart campus workspace."
      footer={
        <>
          <span>New here?</span>
          <Link to="/register" className="relative font-semibold text-campus-700 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:bg-campus-600 after:transition-transform after:duration-300 hover:text-campus-800 hover:after:origin-left hover:after:scale-x-100">
            Create account
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <AuthField
          id="login-email"
          label="Email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="name@campus.edu"
          error={errors.email}
          autoComplete="email"
          name="email"
        />
        <AuthField
          id="login-password"
          label="Password"
          type="password"
          value={form.password}
          onChange={onChange}
          placeholder="Enter your password"
          error={errors.password}
          autoComplete="current-password"
          name="password"
        />

        {apiError ? <p className="text-sm text-rose-600" role="alert">{apiError}</p> : null}

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(13,148,136,0.28)] transition duration-200 hover:scale-[1.01] hover:shadow-[0_16px_35px_rgba(37,99,235,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={!canSubmit || isSubmitting}
        >
          <span className="inline-flex items-center gap-2">
            {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : null}
            {isSubmitting ? "Signing In..." : "Login"}
          </span>
        </button>

        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="relative text-sm font-semibold text-campus-700 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:bg-campus-600 after:transition-transform after:duration-300 hover:text-campus-800 hover:after:origin-left hover:after:scale-x-100">
            Forgot Password?
          </Link>
          <Link to="/register" className="relative text-sm font-semibold text-campus-700 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:bg-campus-600 after:transition-transform after:duration-300 hover:text-campus-800 hover:after:origin-left hover:after:scale-x-100">
            Register
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
