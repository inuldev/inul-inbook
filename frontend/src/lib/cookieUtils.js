/**
 * Utility functions for working with cookies in the browser
 */

/**
 * Set a cookie with the given name, value, and options
 * @param {string} name - The name of the cookie
 * @param {string} value - The value of the cookie
 * @param {Object} options - Cookie options
 * @param {number} options.maxAge - Max age in seconds
 * @param {string} options.path - Cookie path
 * @param {boolean} options.secure - Whether the cookie should be secure
 * @param {string} options.sameSite - SameSite attribute (strict, lax, none)
 */
export function setCookie(name, value, options = {}) {
  const {
    maxAge = 60 * 60 * 24 * 30, // 30 days by default
    path = "/",
    secure = window.location.protocol === "https:",
    sameSite = "lax",
    domain = undefined, // Allow setting domain for cross-subdomain cookies
  } = options;

  // Determine if we're in production or development
  const isProduction =
    process.env.NODE_ENV === "production" ||
    window.location.hostname !== "localhost";

  // In production, default to sameSite=none for cross-domain compatibility
  // but only if secure is true (required for sameSite=none)
  const effectiveSameSite =
    isProduction && secure ? sameSite || "none" : sameSite;

  let cookie = `${name}=${encodeURIComponent(
    value
  )}; path=${path}; max-age=${maxAge}`;

  if (secure) {
    cookie += "; secure";
  }

  if (effectiveSameSite) {
    cookie += `; samesite=${effectiveSameSite}`;
  }

  // Add domain if specified (useful for sharing cookies across subdomains)
  if (domain) {
    cookie += `; domain=${domain}`;
  }

  // Try to set the cookie
  try {
    document.cookie = cookie;
    console.log(`Cookie set: ${name} (${cookie.substring(0, 50)}...)`);

    // Verify if the cookie was actually set
    setTimeout(() => {
      const cookieExists = document.cookie
        .split("; ")
        .some((c) => c.startsWith(`${name}=`));
      console.log(
        `Cookie ${name} verification: ${
          cookieExists ? "set successfully" : "failed to set"
        }`
      );
    }, 50);
  } catch (error) {
    console.error(`Error setting cookie ${name}:`, error);

    // Try with more permissive settings as fallback
    try {
      const fallbackCookie = `${name}=${encodeURIComponent(
        value
      )}; path=${path}; max-age=${maxAge}`;
      document.cookie = fallbackCookie;
      console.log(`Fallback cookie set: ${name}`);
    } catch (fallbackError) {
      console.error(`Error setting fallback cookie ${name}:`, fallbackError);
    }
  }
}

/**
 * Get a cookie by name
 * @param {string} name - The name of the cookie to get
 * @returns {string|null} - The cookie value or null if not found
 */
export function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=");
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

/**
 * Delete a cookie by name
 * @param {string} name - The name of the cookie to delete
 * @param {Object} options - Cookie options
 * @param {string} options.path - Cookie path
 * @param {boolean} options.secure - Whether the cookie should be secure
 * @param {string} options.sameSite - SameSite attribute (strict, lax, none)
 */
export function deleteCookie(name, options = {}) {
  const {
    path = "/",
    secure = window.location.protocol === "https:",
    sameSite = "lax",
    domain = undefined, // Tambahkan opsi domain
  } = options;

  // Menentukan apakah kita berada di lingkungan produksi atau pengembangan
  const isProduction =
    process.env.NODE_ENV === "production" ||
    window.location.hostname !== "localhost";

  // Di produksi, default ke sameSite=none untuk kompatibilitas lintas domain
  const effectiveSameSite =
    isProduction && secure ? sameSite || "none" : sameSite;

  try {
    // Coba hapus dengan berbagai kombinasi pengaturan untuk memastikan cookie benar-benar dihapus

    // 1. Hapus dengan pengaturan dasar
    document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

    // 2. Hapus dengan secure dan samesite
    let cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

    if (secure) {
      cookie += "; secure";
    }

    if (effectiveSameSite) {
      cookie += `; samesite=${effectiveSameSite}`;
    }

    document.cookie = cookie;

    // 3. Hapus dengan domain jika ditentukan
    if (domain) {
      document.cookie = `${name}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

      // Juga coba dengan secure dan samesite
      let domainCookie = `${name}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

      if (secure) {
        domainCookie += "; secure";
      }

      if (effectiveSameSite) {
        domainCookie += `; samesite=${effectiveSameSite}`;
      }

      document.cookie = domainCookie;
    }

    // 4. Coba juga dengan root path
    if (path !== "/") {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    console.log(`Cookie dihapus: ${name}`);

    // Verifikasi apakah cookie benar-benar dihapus
    setTimeout(() => {
      const cookieExists = document.cookie
        .split("; ")
        .some((c) => c.startsWith(`${name}=`));
      if (cookieExists) {
        console.warn(`Cookie ${name} masih ada setelah upaya penghapusan`);
      } else {
        console.log(`Verifikasi: Cookie ${name} berhasil dihapus`);
      }
    }, 50);
  } catch (error) {
    console.error(`Error saat menghapus cookie ${name}:`, error);
  }
}

/**
 * Check if a cookie exists
 * @param {string} name - The name of the cookie to check
 * @returns {boolean} - Whether the cookie exists
 */
export function hasCookie(name) {
  return document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${name}=`));
}

/**
 * Parse all cookies into an object
 * @returns {Object} - An object with all cookies
 */
export function getAllCookies() {
  const cookies = {};
  document.cookie.split("; ").forEach((cookie) => {
    const [name, value] = cookie.split("=");
    if (name) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}
