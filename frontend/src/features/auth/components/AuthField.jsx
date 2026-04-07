import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";

export default function AuthField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}) {
  const [revealPassword, setRevealPassword] = useState(false);

  const icon = useMemo(() => {
    const key = `${name || ""} ${label || ""} ${id || ""}`.toLowerCase();

    if (type === "email" || key.includes("email")) {
      return Mail;
    }

    if (type === "password" || key.includes("password")) {
      return LockKeyhole;
    }

    return UserRound;
  }, [id, label, name, type]);

  const renderType = type === "password" && revealPassword ? "text" : type;
  const hasValue = String(value || "").length > 0;
  const Icon = icon;

  return (
    <div className="grid gap-1.5">
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        id={id}
        name={name}
          className={`peer w-full rounded-2xl border bg-white/85 px-10 pb-3 pt-5 text-sm text-slate-800 outline-none transition duration-200 placeholder:text-transparent focus:border-campus-400 focus:ring-4 focus:ring-emerald-100 ${
            type === "password" ? "pr-11" : ""
          } ${error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : "border-emerald-100"}`}
        type={renderType}
        value={value}
        onChange={onChange}
          placeholder={placeholder || " "}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />

        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 bg-white/90 px-1 text-sm text-slate-500 transition-all duration-200 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-campus-700 ${
            hasValue ? "top-2 translate-y-0 text-xs text-campus-700" : ""
          }`}
        >
          {label}
        </label>

        {type === "password" ? (
          <button
            type="button"
            onClick={() => setRevealPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-600"
            aria-label={revealPassword ? "Hide password" : "Show password"}
          >
            {revealPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {error ? (
          <motion.p
            id={`${id}-error`}
            className="text-xs text-rose-600"
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
