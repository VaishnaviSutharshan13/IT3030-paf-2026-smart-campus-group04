import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

if (import.meta.env.DEV) {
  const toText = (value) => {
    if (typeof value === "string") return value;
    if (value && typeof value.message === "string") return value.message;
    try {
      return JSON.stringify(value);
    } catch {
      if (value && typeof value.toString === "function") return value.toString();
      return "";
    }
  };

  const isSuppressedMessage = (text) => {
    const normalized = String(text || "")
      .toLowerCase()
      .replace(/%c/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return /components?\W*object/.test(normalized)
      && normalized.includes("deprecated")
      && (normalized.includes("soon be removed") || normalized.includes("will be removed"));
  };

  const shouldSuppress = (args) => {
    const text = args
      .map((value) => toText(value))
      .join(" ")
      .trim();

    return isSuppressedMessage(text);
  };

  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);
  const originalLog = console.log.bind(console);
  const originalInfo = console.info.bind(console);
  const originalDebug = console.debug.bind(console);
  const originalTrace = console.trace.bind(console);

  console.warn = (...args) => {
    if (shouldSuppress(args)) {
      return;
    }
    originalWarn(...args);
  };

  console.error = (...args) => {
    if (shouldSuppress(args)) {
      return;
    }
    originalError(...args);
  };

  console.log = (...args) => {
    if (shouldSuppress(args)) {
      return;
    }
    originalLog(...args);
  };

  console.info = (...args) => {
    if (shouldSuppress(args)) {
      return;
    }
    originalInfo(...args);
  };

  console.debug = (...args) => {
    if (shouldSuppress(args)) {
      return;
    }
    originalDebug(...args);
  };

  console.trace = (...args) => {
    if (shouldSuppress(args)) {
      return;
    }
    originalTrace(...args);
  };
}

const savedTheme = localStorage.getItem("theme");
const isDark = savedTheme === "dark";
document.documentElement.classList.toggle("dark", isDark);
document.body.classList.toggle("dark", isDark);
document.body.classList.toggle("dark-mode", isDark);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' was not found.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
