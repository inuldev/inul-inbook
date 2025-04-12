/**
 * Utility functions for debugging authentication issues
 */

import { getAllCookies } from "./cookieUtils";

/**
 * Log detailed authentication information for debugging
 * @param {string} source - The source of the log (e.g., 'login', 'callback')
 * @param {Object} [additionalInfo={}] - Additional information to log
 */
export function logAuthDebugInfo(source, additionalInfo = {}) {
  try {
    console.group(`Auth Debug Info (${source})`);

    // Log basic environment info dengan lebih detail
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
    console.log("Current URL:", window.location.href);
    console.log("Origin:", window.location.origin);
    console.log("Referrer:", document.referrer);
    console.log("User Agent:", navigator.userAgent);
    console.log("Is Secure:", window.location.protocol === "https:");
    console.log("Is localhost:", window.location.hostname === "localhost");
    console.log("Hostname:", window.location.hostname);
    console.log("Protocol:", window.location.protocol);
    console.log("Search Params:", window.location.search);
    console.log(
      "Local Storage Auth Token:",
      localStorage.getItem("auth_token") ? "Present" : "Not present"
    );
    console.log(
      "Local Storage Auth User:",
      localStorage.getItem("auth_user") ? "Present" : "Not present"
    );

    // Log cookies
    console.log("Cookies:", getAllCookies());

    // Log session storage items related to auth
    const sessionItems = {};
    const authKeys = [
      "loginRedirectUrl",
      "frontendUrl",
      "googleAuthTimestamp",
      "googleAuthState",
      "authError",
    ];

    authKeys.forEach((key) => {
      const value = sessionStorage.getItem(key);
      if (value) {
        sessionItems[key] = value;
      }
    });

    console.log("Session Storage:", sessionItems);

    // Log additional info
    if (Object.keys(additionalInfo).length > 0) {
      console.log("Additional Info:", additionalInfo);
    }

    console.groupEnd();
  } catch (error) {
    console.error("Error logging auth debug info:", error);
  }
}

/**
 * Store authentication error information in session storage
 * @param {string} errorMessage - The error message
 * @param {Object} [errorDetails={}] - Additional error details
 */
export function storeAuthError(errorMessage, errorDetails = {}) {
  try {
    const errorInfo = {
      message: errorMessage,
      timestamp: new Date().toISOString(),
      ...errorDetails,
    };

    sessionStorage.setItem("authError", JSON.stringify(errorInfo));
    console.error("Auth error stored:", errorInfo);
  } catch (error) {
    console.error("Error storing auth error:", error);
  }
}

/**
 * Get stored authentication error information
 * @returns {Object|null} The stored error information or null if none exists
 */
export function getStoredAuthError() {
  try {
    const errorJson = sessionStorage.getItem("authError");
    if (!errorJson) return null;

    return JSON.parse(errorJson);
  } catch (error) {
    console.error("Error retrieving stored auth error:", error);
    return null;
  }
}

/**
 * Clear stored authentication error information
 */
export function clearStoredAuthError() {
  try {
    sessionStorage.removeItem("authError");
  } catch (error) {
    console.error("Error clearing stored auth error:", error);
  }
}

/**
 * Diagnosa masalah cross-domain dan CORS
 * @returns {Object} Hasil diagnosa
 */
export function diagnoseCrossDomainIssues() {
  try {
    const results = {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
      protocol: window.location.protocol,
      isSecure: window.location.protocol === "https:",
      hostname: window.location.hostname,
      origin: window.location.origin,
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
      cookiesEnabled: navigator.cookieEnabled,
      cookiesPresent: document.cookie.length > 0,
      cookieCount: document.cookie.split(";").length,
      thirdPartyCookiesBlocked: false, // Akan diperbarui di bawah
      localStorageAvailable: false,
      localStorageItems: {},
      issues: [],
    };

    // Periksa apakah localStorage tersedia
    try {
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");
      results.localStorageAvailable = true;

      // Periksa item localStorage yang terkait dengan autentikasi
      const authItems = ["auth_token", "auth_user", "user-storage"];
      authItems.forEach((key) => {
        const value = localStorage.getItem(key);
        results.localStorageItems[key] = value ? "present" : "not present";
      });
    } catch (e) {
      results.issues.push("localStorage tidak tersedia: " + e.message);
    }

    // Periksa apakah third-party cookies diblokir
    // Catatan: Ini hanya perkiraan, tidak ada cara yang pasti untuk mendeteksinya
    if (results.isSecure && results.cookiesEnabled && !results.cookiesPresent) {
      results.thirdPartyCookiesBlocked = true;
      results.issues.push("Kemungkinan third-party cookies diblokir");
    }

    // Periksa apakah backend URL berada di domain yang berbeda
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      try {
        const backendOrigin = new URL(process.env.NEXT_PUBLIC_BACKEND_URL)
          .origin;
        results.isCrossDomain = backendOrigin !== window.location.origin;

        if (results.isCrossDomain) {
          results.issues.push("Cross-domain setup terdeteksi");

          // Periksa apakah backend menggunakan HTTPS
          const backendIsSecure =
            process.env.NEXT_PUBLIC_BACKEND_URL.startsWith("https");
          if (!backendIsSecure) {
            results.issues.push(
              "Backend tidak menggunakan HTTPS, ini dapat menyebabkan masalah cookie"
            );
          }

          // Periksa apakah frontend menggunakan HTTPS
          if (!results.isSecure) {
            results.issues.push(
              "Frontend tidak menggunakan HTTPS, ini dapat menyebabkan masalah cookie"
            );
          }
        }
      } catch (e) {
        results.issues.push("URL backend tidak valid: " + e.message);
      }
    } else {
      results.issues.push("NEXT_PUBLIC_BACKEND_URL tidak dikonfigurasi");
    }

    // Log hasil diagnosa
    console.group("Diagnosa Masalah Cross-Domain");
    console.log("Hasil:", results);
    console.groupEnd();

    return results;
  } catch (error) {
    console.error("Error saat mendiagnosa masalah cross-domain:", error);
    return {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
  }
}
