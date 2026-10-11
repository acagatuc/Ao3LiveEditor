import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./i18n";
import "./index.css";
import App from "./App.tsx";
import { importLegacyData } from "./utilities/legacyImport";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
});

// Bring over anything saved on the old addresses before the app reads storage.
importLegacyData().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
