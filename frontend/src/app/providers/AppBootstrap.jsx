import React from "react";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

const THEME_STORAGE_KEY = "theme";

function applyThemeFromStorage() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const isDark = savedTheme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark-mode", isDark);
}

export default function AppBootstrap({ children }) {
  const bootstrapSession = useAuthStore((state) => state.bootstrapSession);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  return children;
}
