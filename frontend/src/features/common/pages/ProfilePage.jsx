import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../shared/components/feedback/ToastProvider";
import { useAuth } from "../../auth/context/AuthContext";
import { getMyProfile, updateMyProfile, updateMySettings } from "../../user/services/profileApi";

const roleColors = {
  super_admin: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  admin: "bg-amber-100 text-amber-700 border-amber-200",
  lecturer: "bg-sky-100 text-sky-700 border-sky-200",
  student: "bg-emerald-100 text-emerald-700 border-emerald-200",
  technician: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export default function ProfilePage() {
  const { user, login } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "student",
    status: "active",
    phone: "",
    address: "",
    bio: "",
    profileImageUrl: "",
  });
  const [initialEmail, setInitialEmail] = useState("");

  const roleClass = useMemo(() => roleColors[form.role] || roleColors.student, [form.role]);
  const isAdmin = form.role === "admin" || form.role === "super_admin";
  const avatarSrc =
    form.profileImageUrl ||
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=320&q=80";

  async function loadProfile() {
    setLoading(true);
    try {
      const profile = await getMyProfile();
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        role: profile.role || "student",
        status: profile.status || "active",
        phone: profile.phone || "",
        address: profile.address || "",
        bio: profile.bio || "",
        profileImageUrl: profile.profileImageUrl || "",
      });
      setInitialEmail(profile.email || "");
      setErrors({});
      setAvatarError("");
    } catch (error) {
      toast.error(error.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to process image."));
      image.src = source;
    });
  }

  async function optimizeProfileImage(file) {
    const sourceDataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(sourceDataUrl);

    const maxSide = 720;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Image processing is not supported in this browser.");
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const maxBase64Length = Math.floor((900 * 1024 * 4) / 3);
    let quality = 0.86;
    let output = canvas.toDataURL("image/jpeg", quality);

    while (output.length > maxBase64Length && quality > 0.45) {
      quality -= 0.08;
      output = canvas.toDataURL("image/jpeg", quality);
    }

    if (output.length > maxBase64Length) {
      throw new Error("Image is too large even after optimization. Please choose a smaller file.");
    }

    return output;
  }

  async function onFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError("Only JPG and PNG files are allowed.");
      toast.error("Only JPG and PNG files are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image size must be 2MB or less.");
      toast.error("Image size must be 2MB or less.");
      return;
    }

    setImageProcessing(true);
    try {
      const optimizedDataUrl = await optimizeProfileImage(file);
      setAvatarError("");
      setForm((prev) => ({ ...prev, profileImageUrl: optimizedDataUrl }));
      toast.success("Profile image ready to save.");
    } catch (error) {
      const message = error?.message || "Failed to process image.";
      setAvatarError(message);
      toast.error(message);
    } finally {
      setImageProcessing(false);
    }

    event.target.value = "";
  }

  function removeAvatar() {
    setAvatarError("");
    setForm((prev) => ({ ...prev, profileImageUrl: "" }));
  }

  function validateForm() {
    const nextErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = String(form.phone || "").replace(/\D/g, "");

    if (!form.name.trim()) {
      nextErrors.name = "Name is required";
    }

    if (!emailRegex.test(String(form.email || "").trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if (form.phone && !/^\d+$/.test(form.phone)) {
      nextErrors.phone = "Phone must contain only numbers";
    } else if (form.phone && phoneDigits.length < 10) {
      nextErrors.phone = "Phone must be at least 10 digits";
    }

    if ((form.bio || "").length > 250) {
      nextErrors.bio = "Bio must be 250 characters or less";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSave(event) {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors.");
      return;
    }

    setSaving(true);
    try {
      const profileResponse = await updateMyProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
        bio: form.bio,
        profileImageUrl: form.profileImageUrl,
      });

      let mergedUser = profileResponse?.user || null;

      if (isAdmin && form.email.trim().toLowerCase() !== initialEmail.trim().toLowerCase()) {
        const settingsResponse = await updateMySettings({ email: form.email.trim().toLowerCase() });
        mergedUser = settingsResponse?.user || mergedUser;
        setInitialEmail(form.email.trim().toLowerCase());
      }

      if (mergedUser) {
        login({ token: null, user: { ...user, ...mergedUser } });
      }

      toast.success("Profile updated successfully");
      loadProfile();
    } catch (error) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="panel p-5">
        <p className="text-sm text-slate-500">Loading profile...</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.8fr]">
        <aside className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
          <h2 className="text-lg font-semibold text-slate-800">Profile Image</h2>
          <p className="mt-1 text-sm text-slate-500">Upload a JPG or PNG image (max 2MB).</p>

          <div className="mt-5 flex flex-col items-center">
            <img
              src={avatarSrc}
              alt="Profile"
              className="h-36 w-36 rounded-full border-4 border-emerald-100 object-cover shadow-md"
            />
            <p className="mt-3 text-base font-semibold text-slate-800">{form.name || "Campus User"}</p>
            <p className="text-sm text-slate-500">{form.email || "user@smartcampus.edu"}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${roleClass}`}>
              {form.role.replace("_", " ")}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                form.status === "active"
                  ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                  : "border-rose-200 bg-rose-100 text-rose-700"
              }`}
            >
              {form.status}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <label
              htmlFor="profile-image-file"
              className="cursor-pointer rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-green-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(16,185,129,0.28)] transition hover:brightness-105"
            >
              Upload Image
            </label>
            <button
              type="button"
              onClick={removeAvatar}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              disabled={imageProcessing}
            >
              Remove
            </button>
            <input
              id="profile-image-file"
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={onFileChange}
              disabled={imageProcessing}
            />
          </div>
          {imageProcessing ? <p className="mt-2 text-sm text-slate-500">Optimizing image...</p> : null}
          {avatarError ? <p className="mt-2 text-sm font-medium text-rose-600">{avatarError}</p> : null}
        </aside>

        <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]" onSubmit={onSave}>
          <h2 className="text-lg font-semibold text-slate-800">Profile Details</h2>
          <p className="mt-1 text-sm text-slate-500">Keep your personal information up to date.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="profile-name">Full Name</label>
            <input
              id="profile-name"
              className={`input-field ${errors.name ? "border-rose-400 ring-1 ring-rose-200" : ""}`}
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="Enter your full name"
              required
            />
            {errors.name ? <p className="text-xs font-medium text-rose-600">{errors.name}</p> : null}
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="profile-email">Email</label>
            <input
              id="profile-email"
              className={`input-field ${errors.email ? "border-rose-400 ring-1 ring-rose-200" : ""}`}
              value={form.email}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, email: e.target.value }));
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
              disabled={!isAdmin}
              placeholder="your.email@smartcampus.edu"
            />
            {errors.email ? <p className="text-xs font-medium text-rose-600">{errors.email}</p> : null}
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="profile-role">Role</label>
            <div className="flex h-[42px] items-center">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${roleClass}`}>
                {form.role.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="profile-phone">Phone</label>
            <input
              id="profile-phone"
              className={`input-field ${errors.phone ? "border-rose-400 ring-1 ring-rose-200" : ""}`}
              value={form.phone}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, phone: e.target.value.replace(/[^\d]/g, "") }));
                setErrors((prev) => ({ ...prev, phone: "" }));
              }}
              placeholder="0771234567"
            />
            {errors.phone ? <p className="text-xs font-medium text-rose-600">{errors.phone}</p> : null}
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="profile-address">Address</label>
            <input
              id="profile-address"
              className="input-field"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Enter your address"
            />
          </div>

          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="profile-bio">Bio</label>
            <textarea
              id="profile-bio"
              className={`input-field min-h-28 ${errors.bio ? "border-rose-400 ring-1 ring-rose-200" : ""}`}
              maxLength={250}
              value={form.bio}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, bio: e.target.value }));
                setErrors((prev) => ({ ...prev, bio: "" }));
              }}
              placeholder="Tell us about yourself"
            />
            <div className="flex items-center justify-between text-xs">
              <span className={errors.bio ? "font-medium text-rose-600" : "text-slate-500"}>
                {errors.bio || "Max 250 characters"}
              </span>
              <span className="text-slate-500">{(form.bio || "").length}/250</span>
            </div>
          </div>
        </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(16,185,129,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={saving || imageProcessing}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={loadProfile}
              disabled={saving || imageProcessing}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
