import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import "./world-author-catalog.ts";
import App from "./App.tsx";
import "./index.css";
import "./landing.css";
import "./school.css";
import "./school-ui-v2.css";
import "./compressed-history.css";
import "./adaptive-timeline.css";
import { installSchoolEnhancements } from "./school-enhancements.ts";
import { installSchoolLayout } from "./school-layout.ts";
import { installSchoolUiV2 } from "./school-ui-v2.ts";
import { installCompressedHistory } from "./compressed-history.ts";
import { installAdaptiveTimeline } from "./adaptive-timeline.ts";

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Časovrstvy failed to render", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#f6f0e5",
          color: "#35251f",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <section
          style={{
            width: "min(620px, 100%)",
            padding: 28,
            border: "1px solid #d8c8b4",
            borderRadius: 16,
            background: "#fffaf1",
            boxShadow: "0 20px 60px rgba(69, 43, 29, 0.14)",
          }}
        >
          <h1 style={{ margin: "0 0 10px", fontSize: 24 }}>Časovrstvy se nepodařilo spustit</h1>
          <p style={{ margin: "0 0 14px", lineHeight: 1.6 }}>
            Aplikace narazila na chybu při načítání. Obnov stránku; pokud se zpráva zobrazí znovu,
            zkopíruj text níže.
          </p>
          <code
            style={{
              display: "block",
              padding: 14,
              borderRadius: 10,
              background: "#2a211d",
              color: "#ffe9c7",
              overflowWrap: "anywhere",
            }}
          >
            {this.state.error.message}
          </code>
        </section>
      </main>
    );
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Na stránce chybí kořenový prvek #root.");
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

installSchoolEnhancements();
installSchoolLayout();
installSchoolUiV2();
installCompressedHistory();
installAdaptiveTimeline();
