import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import AuthField from "../components/AuthField";
import { registerUser } from "../services/authClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../../../shared/components/feedback/ToastProvider";

const roleHome = {
  super_admin: "/admin-dashboard",
  student: "/student-dashboard",
  lecturer: "/lecturer-dashboard",
  admin: "/admin-dashboard",
  technician: "/technician-dashboard",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [errors, setErrors] = useState({});

  const canSubmit = useMemo(
    () =>
      [form.name, form.email, form.password, form.confirmPassword]
        .every((value) => String(value).trim().length > 0),
    [form]
  );

  function validate(values) {
    const nextErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (values.name.trim().length < 3) {
      nextErrors.name = "Name must contain at least 3 characters.";
    }

    if (!emailRegex.test(values.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!strongPassword.test(values.password)) {
      nextErrors.password = "Use 8+ chars with upper, lower, number, and symbol.";
    }

    if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
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
      const auth = await registerUser(form);
      const user = login(auth);
      const successMessage = auth.message || "Registration successful.";
      toast.success(successMessage);
      navigate(roleHome[user.role], { replace: true });
    } catch (error) {
      const cleanError = error.message || "Registration failed. Please verify your details.";
      setApiError(cleanError);
      toast.error(cleanError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Set up your smart campus account in under a minute."
      footer={
        <>
          <span>Already have an account?</span>
          <Link to="/login" className="relative font-semibold text-campus-700 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:bg-campus-600 after:transition-transform after:duration-300 hover:text-campus-800 hover:after:origin-left hover:after:scale-x-100">
            Login
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <AuthField
          id="register-name"
          name="name"
          label="Full Name"
          value={form.name}
          onChange={onChange}
          placeholder="Jane Doe"
          error={errors.name}
          autoComplete="name"
        />
        <AuthField
          id="register-email"
          name="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="name@campus.edu"
          error={errors.email}
          autoComplete="email"
        />
        <AuthField
          id="register-password"
          name="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={onChange}
          placeholder="8+ chars, upper/lower/number/symbol"
          error={errors.password}
          autoComplete="new-password"
        />
        <AuthField
          id="register-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={onChange}
          placeholder="Repeat your password"
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <div className="grid gap-1.5">
          <label htmlFor="register-role" className="text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            id="register-role"
            name="role"
            className="w-full rounded-2xl border border-emerald-100 bg-white/85 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-campus-400 focus:ring-4 focus:ring-emerald-100"
            value={form.role}
            onChange={onChange}
          >
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="technician">Technician</option>
          </select>
        </div>

        {apiError ? <p className="text-sm text-rose-600" role="alert">{apiError}</p> : null}

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(13,148,136,0.28)] transition duration-200 hover:scale-[1.01] hover:shadow-[0_16px_35px_rgba(37,99,235,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={!canSubmit || isSubmitting}
        >
          <span className="inline-flex items-center gap-2">
            {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : null}
            {isSubmitting ? "Creating Account..." : "Register"}
          </span>
        </button>

        <div className="flex items-center justify-end">
          <Link to="/login" className="relative text-sm font-semibold text-campus-700 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:bg-campus-600 after:transition-transform after:duration-300 hover:text-campus-800 hover:after:origin-left hover:after:scale-x-100">
            Login instead
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
