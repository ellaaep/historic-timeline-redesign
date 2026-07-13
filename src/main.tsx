import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import "./world-author-catalog.ts";
import "./curriculum-catalog.ts";
import AppRedesign from "./AppRedesign.tsx";
import "./redesign.css";

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
          background: "#f7f1e6",
          color: "#241b17",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <section
          style={{
            width: "min(640px, 100%)",
            padding: 30,
            border: "1px solid #dfd4c5",
            borderRadius: 18,
            background: "#fffdf8",
            boxShadow: "0 24px 70px rgba(65, 43, 29, 0.16)",
          }}
        >
          <h1 style={{ margin: "0 0 10px", fontSize: 26 }}>Časovrstvy se nepodařilo spustit</h1>
          <p style={{ margin: "0 0 14px", lineHeight: 1.6 }}>
            Nová verze narazila na chybu při načítání. Obnov stránku a případně zkopíruj text níže.
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
      <AppRedesign />
    </ErrorBoundary>
  </StrictMode>,
);
