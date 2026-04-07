import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";

const roleHomes = {
  super_admin: "/admin-dashboard",
  student: "/student-dashboard",
  lecturer: "/lecturer-dashboard",
  admin: "/admin-dashboard",
  technician: "/technician-dashboard",
};

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading your account...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={roleHomes[user?.role] || "/login"} replace />;
  }

  return <Outlet />;
}
