import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop error (common with Radix UI components)
if (typeof window !== 'undefined') {
  const originalError = window.onerror;
  window.onerror = (message, ...args) => {
    if (typeof message === 'string' && message.includes('ResizeObserver')) {
      return true;
    }
    return originalError ? originalError(message, ...args) : false;
  };

  window.addEventListener('error', (e) => {
    if (e.message?.includes('ResizeObserver')) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return true;
    }
  });

  // Also handle unhandled rejections
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason?.message?.includes('ResizeObserver')) {
      e.preventDefault();
      return true;
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
