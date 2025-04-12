"use client";

import React, { useState } from "react";

import { logAuthDebugInfo } from "@/lib/authDebug";
import { getAllCookies, setCookie, deleteCookie } from "@/lib/cookieUtils";
import { diagnoseStorageIssues } from "@/lib/authUtils";

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

  const [showMenu, setShowMenu] = useState(false);

  const handleClick = () => {
    setShowMenu(!showMenu);
  };

  const logAuth = () => {
    logAuthDebugInfo("debug-button");
    alert("Informasi autentikasi telah dicatat ke konsol");
  };

  const diagnoseIssues = () => {
    const results = diagnoseStorageIssues();
    console.log("Hasil diagnosa penyimpanan:", results);
    alert(
      `Diagnosa selesai: ${results.issues.length} masalah ditemukan. Lihat konsol untuk detail.`
    );
  };

  const showCookies = () => {
    const cookies = getAllCookies();
    console.log("Cookies saat ini:", cookies);
    alert(
      `${
        Object.keys(cookies).length
      } cookies ditemukan. Lihat konsol untuk detail.`
    );
  };

  const clearAuthCookies = () => {
    deleteCookie("token");
    deleteCookie("auth_status");
    deleteCookie("auth_fallback");
    alert("Cookie autentikasi telah dihapus");
  };

  const clearLocalStorage = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("user-storage");
    alert("Data autentikasi di localStorage telah dihapus");
  };

  const testCookieWrite = () => {
    setCookie("test_cookie", "test_value", {
      maxAge: 60, // 1 menit
      secure: window.location.protocol === "https:",
      sameSite: "lax",
    });
    alert("Test cookie telah dibuat. Periksa apakah berhasil di konsol.");
    setTimeout(() => {
      const cookies = getAllCookies();
      console.log("Cookies setelah test write:", cookies);
    }, 100);
  };

  return (
    <div
      style={{ position: "fixed", bottom: "10px", right: "10px", zIndex: 9999 }}
    >
      {showMenu && (
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "0",
            background: "#333",
            borderRadius: "4px",
            padding: "8px",
            width: "200px",
            boxShadow: "0 0 10px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={logAuth}
              style={{
                background: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Log Info Auth
            </button>

            <button
              onClick={diagnoseIssues}
              style={{
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Diagnosa Cross-Domain
            </button>

            <button
              onClick={showCookies}
              style={{
                background: "#9c27b0",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Tampilkan Cookies
            </button>

            <button
              onClick={testCookieWrite}
              style={{
                background: "#009688",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Test Cookie Write
            </button>

            <button
              onClick={clearAuthCookies}
              style={{
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Hapus Auth Cookies
            </button>

            <button
              onClick={clearLocalStorage}
              style={{
                background: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Hapus Local Storage
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleClick}
        style={{
          background: showMenu ? "#333" : "#ff5722",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "8px 12px",
          fontSize: "12px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showMenu ? "Tutup Debug" : "Lihat Debug"}
      </button>
    </div>
  );
}
