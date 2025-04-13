/**
 * Utility functions untuk autentikasi
 * File ini menggabungkan fungsi-fungsi dari storageUtils.js, authUtils.js, dan authDebug.js
 * untuk menyederhanakan alur autentikasi
 */
import userStore from "@/store/userStore";

/**
 * Memeriksa apakah localStorage tersedia dan berfungsi
 * @returns {boolean} True jika localStorage tersedia dan berfungsi
 */
export function isLocalStorageAvailable() {
  try {
    const testKey = "__test_key__";
    localStorage.setItem(testKey, testKey);
    const result = localStorage.getItem(testKey) === testKey;
    localStorage.removeItem(testKey);
    return result;
  } catch (e) {
    return false;
  }
}

/**
 * Memeriksa apakah sessionStorage tersedia dan berfungsi
 * @returns {boolean} True jika sessionStorage tersedia dan berfungsi
 */
export function isSessionStorageAvailable() {
  try {
    const testKey = "__test_key__";
    sessionStorage.setItem(testKey, testKey);
    const result = sessionStorage.getItem(testKey) === testKey;
    sessionStorage.removeItem(testKey);
    return result;
  } catch (e) {
    return false;
  }
}

/**
 * Memeriksa apakah cookies tersedia dan berfungsi
 * @returns {boolean} True jika cookies tersedia dan berfungsi
 */
export function isCookiesAvailable() {
  try {
    const testKey = "__test_key__";
    document.cookie = `${testKey}=${testKey}; path=/; max-age=1`;
    return document.cookie.indexOf(testKey) !== -1;
  } catch (e) {
    return false;
  }
}

/**
 * Menyimpan token di semua lokasi penyimpanan
 * @param {string} token - Token autentikasi
 * @returns {boolean} True jika berhasil disimpan di setidaknya satu lokasi
 */
export function storeToken(token) {
  if (!token) return false;

  console.log("Storing token in storage locations");
  let success = false;

  // 1. Store in localStorage if available (primary storage)
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem("auth_token", token);
      // Store a backup copy
      localStorage.setItem("auth_token_backup", token);
      success = true;
      console.log("Token stored in localStorage");
    } catch (lsError) {
      console.error("Error storing token in localStorage:", lsError);
    }
  } else {
    console.warn("localStorage not available");
  }

  // 4. Store in direct cookie if available
  if (isCookiesAvailable()) {
    try {
      const isSecure = window.location.protocol === "https:";
      const isProduction =
        process.env.NODE_ENV === "production" ||
        window.location.hostname !== "localhost";
      const sameSite = isProduction ? "none" : "lax";

      // Sederhanakan: hanya gunakan satu jenis cookie untuk token
      // Gunakan token untuk produksi dan dev_token untuk development
      if (isProduction) {
        // Set token cookie untuk produksi
        document.cookie = `token=${encodeURIComponent(
          token
        )}; path=/; max-age=${30 * 24 * 60 * 60}${
          isSecure ? "; Secure" : ""
        }; SameSite=${sameSite}`;

        // Set auth_status cookie
        document.cookie = `auth_status=logged_in; path=/; max-age=${
          30 * 24 * 60 * 60
        }${isSecure ? "; Secure" : ""}; SameSite=lax`;
      } else {
        // Set dev_token cookie untuk development
        document.cookie = `dev_token=${encodeURIComponent(
          token
        )}; path=/; max-age=${30 * 24 * 60 * 60}${
          isSecure ? "; Secure" : ""
        }; SameSite=${sameSite}`;

        // Set dev_auth_status cookie
        document.cookie = `dev_auth_status=logged_in; path=/; max-age=${
          30 * 24 * 60 * 60
        }${isSecure ? "; Secure" : ""}; SameSite=lax`;
      }

      success = true;
      console.log("Token stored in cookies with simplified settings");
    } catch (cookieError) {
      console.error("Error storing token in cookies:", cookieError);
    }
  } else {
    console.warn("Cookies not available");
  }

  // 5. Verify storage (simplified)
  setTimeout(() => {
    try {
      console.log("=== TOKEN STORAGE VERIFICATION ===");
      console.log(
        "localStorage token:",
        localStorage.getItem("auth_token") ? "present" : "missing"
      );
      console.log("cookies:", document.cookie);

      // Cek cookie berdasarkan environment
      const isProduction =
        process.env.NODE_ENV === "production" ||
        window.location.hostname !== "localhost";

      if (isProduction) {
        console.log(
          "token cookie present:",
          document.cookie.includes("token=") ? "yes" : "no"
        );
        console.log(
          "auth_status cookie present:",
          document.cookie.includes("auth_status=") ? "yes" : "no"
        );
      } else {
        console.log(
          "dev_token cookie present:",
          document.cookie.includes("dev_token=") ? "yes" : "no"
        );
        console.log(
          "dev_auth_status cookie present:",
          document.cookie.includes("dev_auth_status=") ? "yes" : "no"
        );
      }
    } catch (verifyError) {
      console.error("Error verifying token storage:", verifyError);
    }
  }, 100);

  return success;
}

/**
 * Menyimpan user data di semua lokasi penyimpanan
 * @param {Object} userData - Data pengguna
 * @returns {boolean} True jika berhasil disimpan di setidaknya satu lokasi
 */
export function storeUserData(userData) {
  if (!userData) return false;

  console.log("Storing user data in all storage locations");
  let success = false;

  try {
    const userJson = JSON.stringify(userData);

    // 1. Store in localStorage if available
    if (isLocalStorageAvailable()) {
      try {
        localStorage.setItem("auth_user", userJson);
        success = true;
        console.log("User data stored in localStorage");
      } catch (lsError) {
        console.error("Error storing user data in localStorage:", lsError);
      }
    } else {
      console.warn("localStorage not available for storing user data");
    }

    // 2. Store in sessionStorage if available
    if (isSessionStorageAvailable()) {
      try {
        sessionStorage.setItem("auth_user", userJson);
        success = true;
        console.log("User data stored in sessionStorage");
      } catch (ssError) {
        console.error("Error storing user data in sessionStorage:", ssError);
      }
    } else {
      console.warn("sessionStorage not available for storing user data");
    }

    // 3. Store in window object
    try {
      window.authUser = userData;
      success = true;
      console.log("User data stored in window object");
    } catch (windowError) {
      console.error("Error storing user data in window object:", windowError);
    }
  } catch (error) {
    console.error("Error processing user data for storage:", error);
  }

  return success;
}

/**
 * Mengambil token dari semua lokasi penyimpanan
 * @returns {string|null} Token autentikasi atau null jika tidak ditemukan
 */
export function getToken() {
  try {
    let token = null;
    const isProduction =
      process.env.NODE_ENV === "production" ||
      window.location.hostname !== "localhost";

    // 1. Try cookies first (primary method)
    if (isCookiesAvailable()) {
      if (isProduction) {
        // Production environment: use token cookie
        token = getTokenFromCookie("token");
        if (token) {
          console.log("Token retrieved from token cookie");
          return token;
        }
      } else {
        // Development environment: use dev_token cookie
        token = getTokenFromCookie("dev_token");
        if (token) {
          console.log("Token retrieved from dev_token cookie");
          return token;
        }
      }
    }

    // 2. Try localStorage as backup
    if (!token && isLocalStorageAvailable()) {
      token = localStorage.getItem("auth_token");
      if (token) {
        console.log("Token retrieved from localStorage");
        return token;
      }

      // Try backup token in localStorage
      token = localStorage.getItem("auth_token_backup");
      if (token) {
        console.log("Token retrieved from localStorage backup");
        return token;
      }
    }

    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
}

/**
 * Mengambil user data dari semua lokasi penyimpanan
 * @returns {Object|null} Data pengguna atau null jika tidak ditemukan
 */
export function getUserData() {
  try {
    let userData = null;

    // 1. Try localStorage first
    if (isLocalStorageAvailable()) {
      const userJson = localStorage.getItem("auth_user");
      if (userJson) {
        try {
          userData = JSON.parse(userJson);
          console.log("User data retrieved from localStorage");
          return userData;
        } catch (parseError) {
          console.error(
            "Error parsing user data from localStorage:",
            parseError
          );
        }
      }
    }

    // 2. Try sessionStorage next
    if (!userData && isSessionStorageAvailable()) {
      const userJson = sessionStorage.getItem("auth_user");
      if (userJson) {
        try {
          userData = JSON.parse(userJson);
          console.log("User data retrieved from sessionStorage");
          return userData;
        } catch (parseError) {
          console.error(
            "Error parsing user data from sessionStorage:",
            parseError
          );
        }
      }
    }

    // 3. Try window object
    if (!userData && typeof window !== "undefined" && window.authUser) {
      userData = window.authUser;
      console.log("User data retrieved from window object");
      return userData;
    }

    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
}

/**
 * Mengambil token dari cookie
 * @param {string} cookieName - Nama cookie
 * @returns {string|null} Token autentikasi atau null jika tidak ditemukan
 */
export function getTokenFromCookie(cookieName) {
  try {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((c) => c.startsWith(`${cookieName}=`));

    if (tokenCookie) {
      return decodeURIComponent(tokenCookie.split("=")[1]);
    }

    return null;
  } catch (error) {
    console.error(`Error getting token from ${cookieName} cookie:`, error);
    return null;
  }
}

/**
 * Menghapus semua data autentikasi secara komprehensif
 * @returns {Promise<boolean>} Promise yang mengembalikan true jika berhasil, false jika gagal
 */
export async function clearAllAuthData() {
  console.log("Clearing all authentication data comprehensively");
  let success = true;

  try {
    // 1. Clear localStorage if available
    if (isLocalStorageAvailable()) {
      try {
        // Hapus semua item auth dari localStorage
        const authKeys = [
          "auth_token",
          "auth_user",
          "auth_token_backup",
          "auth_error",
          "auth_redirect",
          "user_data",
          "token",
        ];

        authKeys.forEach((key) => localStorage.removeItem(key));
        console.log("Cleared localStorage authentication data");
      } catch (lsError) {
        console.error("Error clearing localStorage:", lsError);
        success = false;
      }
    }

    // 2. Clear sessionStorage if available
    if (isSessionStorageAvailable()) {
      try {
        // Hapus semua item auth dari sessionStorage
        const authKeys = [
          "auth_token",
          "auth_user",
          "auth_token_backup",
          "auth_error",
          "auth_redirect",
          "user_data",
          "token",
        ];

        authKeys.forEach((key) => sessionStorage.removeItem(key));
        console.log("Cleared sessionStorage authentication data");
      } catch (ssError) {
        console.error("Error clearing sessionStorage:", ssError);
        success = false;
      }
    }

    // 3. Clear window object if available
    if (typeof window !== "undefined") {
      try {
        // Hapus semua properti auth dari window object
        const windowProps = ["authToken", "authUser", "userData", "token"];

        windowProps.forEach((prop) => {
          if (window[prop]) delete window[prop];
        });

        console.log("Cleared window object authentication data");
      } catch (winError) {
        console.error("Error clearing window object:", winError);
        success = false;
      }
    }

    // 4. Clear cookies with multiple approaches
    if (isCookiesAvailable()) {
      try {
        // Daftar semua cookie yang mungkin digunakan untuk autentikasi
        const cookiesToClear = [
          "token",
          "auth_status",
          "dev_token",
          "dev_auth_status",
          "auth_token_direct",
          "auth_token",
          "refresh_token",
          "session_id",
        ];

        // Hapus dengan berbagai kombinasi pengaturan
        cookiesToClear.forEach((cookieName) => {
          // Metode 1: Hapus dengan path=/ (standar)
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

          // Metode 2: Hapus dengan Secure dan SameSite=None untuk produksi
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=None`;

          // Metode 3: Hapus dengan SameSite=Lax untuk development
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

          // Metode 4: Hapus dengan domain (untuk subdomain sharing)
          try {
            const domain = window.location.hostname
              .split(".")
              .slice(-2)
              .join(".");
            document.cookie = `${cookieName}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          } catch (e) {}
        });

        // Verifikasi apakah cookies benar-benar dihapus
        setTimeout(() => {
          const remainingCookies = document.cookie.split("; ");
          const authCookiesRemaining = cookiesToClear.filter((name) =>
            remainingCookies.some((c) => c.startsWith(`${name}=`))
          );

          if (authCookiesRemaining.length > 0) {
            console.warn(
              "Some auth cookies could not be cleared:",
              authCookiesRemaining
            );

            // Coba sekali lagi dengan metode yang lebih agresif
            authCookiesRemaining.forEach((cookieName) => {
              // Coba dengan path yang berbeda
              ["/", "", "/api", "/auth"].forEach((path) => {
                document.cookie = `${cookieName}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
              });
            });
          } else {
            console.log("All auth cookies successfully cleared");
          }
        }, 100);

        console.log("Cleared all cookies authentication data");
      } catch (cookieError) {
        console.error("Error clearing cookies:", cookieError);
        success = false;
      }
    }

    // 5. Reset Zustand store if available
    try {
      if (typeof userStore !== "undefined" && userStore.setState) {
        userStore.setState({
          user: null,
          token: null,
          tokenFromUrl: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
        console.log("Reset Zustand store");
      }
    } catch (storeError) {
      console.error("Error resetting Zustand store:", storeError);
      success = false;
    }

    console.log("All authentication data cleared comprehensively");
    return success;
  } catch (error) {
    console.error("Error in clearAllAuthData:", error);
    return false;
  }
}

/**
 * Menghapus semua data autentikasi (versi lama untuk kompatibilitas)
 * @returns {boolean} True jika berhasil, false jika gagal
 */
export function clearAuthData() {
  console.log("Legacy clearAuthData called, using clearAllAuthData instead");
  clearAllAuthData();
  return true;
}

/**
 * Memeriksa apakah pengguna sudah login
 * @returns {boolean} True jika pengguna sudah login, false jika belum
 */
export function isAuthenticated() {
  const token = getToken();
  const userData = getUserData();

  // Log authentication status for debugging
  console.log("Authentication check:", {
    hasToken: !!token,
    hasUserData: !!userData,
    tokenLength: token ? token.length : 0,
  });

  // Jika ada token tapi tidak ada user data, coba ambil dari cookies
  if (token && !userData) {
    // Cek apakah ada auth_status cookie yang menunjukkan user sudah login
    const isProduction =
      process.env.NODE_ENV === "production" ||
      window.location.hostname !== "localhost";
    const hasAuthStatus = isProduction
      ? document.cookie.includes("auth_status=logged_in")
      : document.cookie.includes("dev_auth_status=logged_in");

    if (hasAuthStatus) {
      console.log("Token found with auth_status cookie but no user data");
      return "token-only";
    }

    console.log("Token found but no user data and no auth_status cookie");
    return false;
  }

  return !!(token && userData);
}

/**
 * Menginisialisasi autentikasi dari storage
 * @returns {boolean|string} True jika berhasil, "token-only" jika hanya token yang ditemukan, false jika gagal
 */
export function initAuthFromStorage() {
  try {
    console.log("Initializing authentication from storage");

    // Get token and user data using our utility functions
    const token = getToken();
    const userData = getUserData();

    console.log("Auth data from storage:", {
      hasToken: !!token,
      hasUserData: !!userData,
      tokenLength: token ? token.length : 0,
      userDataKeys: userData ? Object.keys(userData) : null,
    });

    if (token && userData) {
      try {
        // Set token dan user data di Zustand store
        userStore.setState({
          token,
          user: userData,
          isAuthenticated: true,
          loading: false,
          error: null,
        });

        console.log("Authentication initialized from storage successfully");
        return true;
      } catch (storeError) {
        console.error("Error setting Zustand store state:", storeError);
        return false;
      }
    } else if (token) {
      // Jika hanya token yang ditemukan, simpan token di state
      try {
        userStore.setState({
          token,
          loading: false,
        });

        console.log("Token found in storage but no user data");
        return "token-only";
      } catch (storeError) {
        console.error("Error setting token in store state:", storeError);
        return false;
      }
    } else {
      console.log("No valid authentication data found in storage");
      return false;
    }
  } catch (error) {
    console.error("Error initializing authentication from storage:", error);
    return false;
  }
}

/**
 * Redirect ke halaman utama setelah login berhasil
 * @param {string} targetUrl - URL tujuan redirect (default: "/")
 */
export function redirectAfterLogin(targetUrl = "/") {
  console.log(`Redirecting after successful login to: ${targetUrl}`);

  try {
    // Tambahkan parameter noredirect untuk mencegah loop redirect
    const url = new URL(targetUrl, window.location.origin);
    url.searchParams.set("noredirect", "true");

    console.log(
      `Modified redirect URL with noredirect parameter: ${url.toString()}`
    );

    // Tambahkan delay kecil untuk memastikan semua data tersimpan
    setTimeout(() => {
      // Gunakan window.location untuk redirect yang lebih kuat
      window.location.href = url.toString();
    }, 100);
  } catch (error) {
    console.error("Error during redirect:", error);
    // Fallback jika terjadi error
    window.location.href = "/?noredirect=true";
  }
}

/**
 * Menangani error autentikasi dan menyimpannya untuk ditampilkan di halaman login
 * @param {Error} error - Error yang terjadi
 * @param {string} context - Konteks di mana error terjadi
 */
export function handleAuthError(error, context = "unknown") {
  console.error(`Auth error in ${context}:`, error);

  try {
    // Simpan error di localStorage untuk ditampilkan di halaman login
    if (isLocalStorageAvailable()) {
      const errorData = {
        message: error?.message || "Authentication error occurred",
        context,
        timestamp: new Date().getTime(),
        stack: error?.stack,
      };

      localStorage.setItem("auth_error", JSON.stringify(errorData));
    }

    // Redirect ke halaman login dengan parameter error
    const loginUrl = new URL("/user-login", window.location.origin);
    loginUrl.searchParams.set("error", "auth_failed");
    loginUrl.searchParams.set(
      "message",
      error?.message || "Authentication error occurred"
    );
    loginUrl.searchParams.set("context", context);

    // Redirect ke halaman login
    window.location.href = loginUrl.toString();
  } catch (handlingError) {
    console.error("Error handling auth error:", handlingError);
    // Fallback redirect
    window.location.href = "/user-login?error=auth_failed";
  }
}

/**
 * Mendiagnosa masalah penyimpanan browser
 * @returns {Object} Hasil diagnosa
 */
export function diagnoseStorageIssues() {
  const results = {
    timestamp: new Date().toISOString(),
    localStorage: {
      available: isLocalStorageAvailable(),
      items: {},
    },
    sessionStorage: {
      available: isSessionStorageAvailable(),
      items: {},
    },
    cookies: {
      available: isCookiesAvailable(),
      items: {},
    },
    issues: [],
  };

  // Periksa localStorage
  if (results.localStorage.available) {
    try {
      // Periksa item autentikasi di localStorage
      const authItems = ["auth_token", "auth_user", "auth_token_backup"];
      authItems.forEach((key) => {
        const value = localStorage.getItem(key);
        results.localStorage.items[key] = value ? "present" : "not present";
      });
    } catch (e) {
      results.issues.push(`Error accessing localStorage: ${e.message}`);
    }
  } else {
    results.issues.push("localStorage not available");
  }

  // Periksa sessionStorage
  if (results.sessionStorage.available) {
    try {
      // Periksa item autentikasi di sessionStorage
      const authItems = ["auth_token", "auth_user", "auth_token_backup"];
      authItems.forEach((key) => {
        const value = sessionStorage.getItem(key);
        results.sessionStorage.items[key] = value ? "present" : "not present";
      });
    } catch (e) {
      results.issues.push(`Error accessing sessionStorage: ${e.message}`);
    }
  } else {
    results.issues.push("sessionStorage not available");
  }

  // Periksa cookies
  if (results.cookies.available) {
    try {
      // Periksa cookies autentikasi
      const cookieString = document.cookie;
      const cookies = cookieString.split("; ");
      const authCookies = [
        "token",
        "auth_token",
        "auth_status",
        "dev_token",
        "auth_token_direct",
      ];

      authCookies.forEach((name) => {
        const found = cookies.some((c) => c.startsWith(`${name}=`));
        results.cookies.items[name] = found ? "present" : "not present";
      });
    } catch (e) {
      results.issues.push(`Error accessing cookies: ${e.message}`);
    }
  } else {
    results.issues.push("cookies not available");
  }

  // Periksa window object
  try {
    results.window = {
      authToken:
        typeof window.authToken !== "undefined" ? "present" : "not present",
      authUser:
        typeof window.authUser !== "undefined" ? "present" : "not present",
    };
  } catch (e) {
    results.issues.push(`Error accessing window object: ${e.message}`);
  }

  // Periksa cross-domain issues
  try {
    results.crossDomain = {
      environment: process.env.NODE_ENV,
      protocol: window.location.protocol,
      isSecure: window.location.protocol === "https:",
      hostname: window.location.hostname,
      origin: window.location.origin,
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
    };
  } catch (e) {
    results.issues.push(`Error diagnosing cross-domain issues: ${e.message}`);
  }

  // Log hasil diagnosa
  console.group("Storage Diagnosis Results");
  console.log(results);
  console.groupEnd();

  return results;
}
