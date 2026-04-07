import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const savedTheme = localStorage.getItem("theme");
const isDark = savedTheme === "dark";
document.documentElement.classList.toggle("dark", isDark);
document.body.classList.toggle("dark", isDark);
document.body.classList.toggle("dark-mode", isDark);

console.log("[main] Bootstrapping React app");

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' was not found.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
