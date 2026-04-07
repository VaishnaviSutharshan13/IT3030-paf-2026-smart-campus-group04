import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";

const roleHomes = {
  student: "/student-dashboard",
  lecturer: "/lecturer-dashboard",
  admin: "/admin-dashboard",
  technician: "/technician-dashboard",
};

export default function PublicOnlyRoute() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={roleHomes[user?.role] || "/login"} replace />;
  }

  return <Outlet />;
}
