"use client";

import React from "react";

import { logAuthState } from "@/lib/debugUtils";

/**
 * Debug button component for authentication debugging
 * Only visible in development or when debug is enabled
 */
export function DebugButton() {
  // Only show in development or when debug is explicitly enabled
  if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "production" &&
    !process.env.NEXT_PUBLIC_DEBUG
  ) {
    return null;
  }

  const handleClick = () => {
    logAuthState();
    alert("Auth state logged to console");
  };

  return (
    <button
      onClick={handleClick}
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        zIndex: 9999,
        background: "#ff5722",
        color: "white",
        border: "none",
        borderRadius: "4px",
        padding: "8px 12px",
        fontSize: "12px",
        cursor: "pointer",
      }}
    >
      Debug Auth
    </button>
  );
}
