import React from "react";
import AppRouter from "./app/router/AppRouter";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { ToastProvider } from "./shared/components/feedback/ToastProvider";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
}
