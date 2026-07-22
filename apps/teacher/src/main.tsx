import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@middle-of-math/ui/styles.css";
import "./teacher.css";
import { TeacherApp } from "./teacher-app";

const requestedTheme = new URLSearchParams(window.location.search).get("theme");
if (requestedTheme === "light" || requestedTheme === "dark") document.documentElement.dataset.theme = requestedTheme;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TeacherApp />
  </StrictMode>
);
