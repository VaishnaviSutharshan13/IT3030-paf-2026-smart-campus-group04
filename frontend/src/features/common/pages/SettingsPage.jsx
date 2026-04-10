import React, { useEffect, useMemo, useState } from "react";
import { Bell, Check, Eye, EyeOff, KeyRound, Lock, Palette, Settings2, Shield } from "lucide-react";
import { useToast } from "../../../shared/components/feedback/ToastProvider";
import { getMyProfile, updateMySettings } from "../../user/services/profileApi";

const themeColors = ["emerald", "teal", "blue", "amber"];
const THEME_STORAGE_KEY = "theme";

function applyDarkMode(enabled) {
  const isDark = Boolean(enabled);
  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark-mode", isDark);
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
}

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-3 transition hover:border-emerald-200">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      </div>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
        <span className="absolute inset-0 rounded-full bg-slate-300 transition-all duration-300 peer-checked:bg-emerald-500" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function PasswordField({ id, label, value, onChange, visible, onToggle, placeholder }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium text-slate-700" htmlFor={id}>{label}</label>
      <div className="relative">
        <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          className="input-field pl-9 pr-10"
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-campus-700"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage({ title = "Settings" }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState("student");
  const [passwordVisible, setPasswordVisible] = useState({ current: false, next: false, confirm: false });
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [form, setForm] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    account: { twoFactorEnabled: false },
    ui: { darkMode: false, themeColor: "emerald" },
    notifications: { emailNotifications: true, systemAlerts: true },
    admin: { modules: { bookings: true, tickets: true, resources: true, reports: true } },
  });

  const isAdminRole = useMemo(() => role === "admin", [role]);
  const hasPasswordValues = Boolean(form.currentPassword || form.newPassword || form.confirmPassword);
  const passwordWeak =
    Boolean(form.newPassword) &&
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(form.newPassword);

  async function loadSettings() {
    setLoading(true);
    try {
      const profile = await getMyProfile();
      setRole(profile.role || "student");

      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      const darkModeFromStorage = savedTheme === "dark" ? true : savedTheme === "light" ? false : null;
      const resolvedDarkMode = darkModeFromStorage ?? Boolean(profile.settings?.ui?.darkMode);

      setForm({
        email: profile.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        account: {
          twoFactorEnabled: Boolean(profile.settings?.account?.twoFactorEnabled),
        },
        ui: {
          darkMode: resolvedDarkMode,
          themeColor: profile.settings?.ui?.themeColor || "emerald",
        },
        notifications: {
          emailNotifications: profile.settings?.notifications?.emailNotifications !== false,
          systemAlerts: profile.settings?.notifications?.systemAlerts !== false,
        },
        admin: {
          modules: {
            bookings: profile.settings?.admin?.modules?.bookings !== false,
            tickets: profile.settings?.admin?.modules?.tickets !== false,
            resources: profile.settings?.admin?.modules?.resources !== false,
            reports: profile.settings?.admin?.modules?.reports !== false,
          },
        },
      });
      applyDarkMode(resolvedDarkMode);
      setPasswordMismatch(false);
    } catch (error) {
      toast.error(error.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function onSubmit(event) {
    event.preventDefault();

    if (form.newPassword || form.confirmPassword || form.currentPassword) {
      if (form.newPassword !== form.confirmPassword) {
        setPasswordMismatch(true);
        toast.error("New passwords do not match.");
        return;
      }
      if (form.newPassword && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(form.newPassword)) {
        toast.error("Password must be 8+ chars with upper, lower, number, symbol.");
        return;
      }
    }

    setPasswordMismatch(false);

    setSaving(true);
    try {
      const payload = {
        email: form.email,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
        account: form.account,
        ui: form.ui,
        notifications: form.notifications,
      };

      if (isAdminRole) {
        payload.admin = form.admin;
      }

      const response = await updateMySettings(payload);
      toast.success(response?.message || "Settings updated.");
      loadSettings();
    } catch (error) {
      toast.error(error.message || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="panel p-5">
        <p className="text-sm text-slate-500">Loading settings...</p>
      </section>
    );
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <section className="panel overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Manage account security, preferences, and alerts.</p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-campus-700">
            {String(role || "user").replace("_", " ")}
          </span>
        </div>
      </section>

      <section className="panel rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield size={18} className="text-campus-700" />
          <h3 className="text-base font-semibold text-slate-800">Account Settings</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="settings-email">Email</label>
            <input
              id="settings-email"
              className="input-field"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <ToggleSwitch
            checked={form.account.twoFactorEnabled}
            onChange={(e) => setForm((prev) => ({ ...prev, account: { ...prev.account, twoFactorEnabled: e.target.checked } }))}
            label="Two-factor authentication"
            description="Add an extra security step during authentication."
          />
        </div>
      </section>

      <section className="panel rounded-3xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound size={18} className="text-campus-700" />
          <h3 className="text-base font-semibold text-slate-800">Password Security</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <PasswordField
            id="settings-current-password"
            label="Current Password"
            value={form.currentPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            visible={passwordVisible.current}
            onToggle={() => setPasswordVisible((prev) => ({ ...prev, current: !prev.current }))}
            placeholder="Enter current password"
          />

          <PasswordField
            id="settings-new-password"
            label="New Password"
            value={form.newPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            visible={passwordVisible.next}
            onToggle={() => setPasswordVisible((prev) => ({ ...prev, next: !prev.next }))}
            placeholder="Enter new password"
          />

          <div className="md:col-span-2">
            <PasswordField
              id="settings-confirm-password"
              label="Confirm New Password"
              value={form.confirmPassword}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                if (passwordMismatch) setPasswordMismatch(false);
              }}
              visible={passwordVisible.confirm}
              onToggle={() => setPasswordVisible((prev) => ({ ...prev, confirm: !prev.confirm }))}
              placeholder="Confirm new password"
            />
            <div className={`mt-2 overflow-hidden text-xs transition-all duration-300 ${passwordMismatch || passwordWeak ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}`}>
              {passwordMismatch ? <p className="text-rose-600">Passwords do not match.</p> : null}
              {!passwordMismatch && passwordWeak ? <p className="text-rose-600">Use 8+ chars with upper, lower, number and symbol.</p> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="panel rounded-3xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Palette size={18} className="text-campus-700" />
            <h3 className="text-base font-semibold text-slate-800">UI Preferences</h3>
          </div>
          <div className="grid gap-4">
            <ToggleSwitch
              checked={form.ui.darkMode}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm((prev) => ({ ...prev, ui: { ...prev.ui, darkMode: checked } }));
                applyDarkMode(checked);
              }}
              label="Dark Mode"
              description="Apply a dark interface across sidebar, dashboard cards and forms."
            />

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="settings-theme-color">Theme Color</label>
              <select
                id="settings-theme-color"
                className="input-field"
                value={form.ui.themeColor}
                onChange={(e) => setForm((prev) => ({ ...prev, ui: { ...prev.ui, themeColor: e.target.value } }))}
              >
                {themeColors.map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="panel rounded-3xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={18} className="text-campus-700" />
            <h3 className="text-base font-semibold text-slate-800">Notifications</h3>
          </div>
          <div className="grid gap-3">
            <ToggleSwitch
              checked={form.notifications.emailNotifications}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, emailNotifications: e.target.checked },
                }))
              }
              label="Email notifications"
              description="Receive updates by email for booking and incident events."
            />
            <ToggleSwitch
              checked={form.notifications.systemAlerts}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, systemAlerts: e.target.checked },
                }))
              }
              label="System alerts"
              description="Show in-app alerts for workflow actions and admin events."
            />
          </div>
        </div>
      </section>

      {isAdminRole ? (
        <section className="panel rounded-3xl p-6">
          <div className="mb-2 flex items-center gap-2">
            <Settings2 size={18} className="text-campus-700" />
            <h3 className="text-base font-semibold text-slate-800">System Configuration</h3>
          </div>
          <p className="text-sm text-slate-500">Enable or disable operational modules for this admin account.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(form.admin.modules).map(([key, value]) => {
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              const descriptions = {
                bookings: "Controls access to booking approval and scheduling workflows.",
                resources: "Controls facilities and resource management operations.",
                tickets: "Controls incident and technician management capabilities.",
                reports: "Controls analytics and operational reporting visibility.",
              };

              return (
                <ToggleSwitch
                  key={key}
                  checked={Boolean(value)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      admin: {
                        ...prev.admin,
                        modules: {
                          ...prev.admin.modules,
                          [key]: e.target.checked,
                        },
                      },
                    }))
                  }
                  label={label}
                  description={descriptions[key] || "Module access control."}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-500 to-green-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(16,185,129,0.25)] transition duration-300 hover:scale-[1.02] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={saving || (hasPasswordValues && (passwordMismatch || passwordWeak))}
        >
          <Check size={16} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
