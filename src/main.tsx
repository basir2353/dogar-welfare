import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

function applyStoredThemeToDocument() {
  try {
    const raw = localStorage.getItem("dogar-ui");
    if (raw) {
      const p = JSON.parse(raw) as { state?: { theme?: string } };
      if (p.state?.theme === "dark") {
        document.documentElement.classList.add("dark");
        return;
      }
    }
  } catch {
    // ignore
  }
  document.documentElement.classList.remove("dark");
}

applyStoredThemeToDocument();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
