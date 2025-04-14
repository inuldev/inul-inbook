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
 * @param {string} options.domain - Cookie domain
 * @param {boolean} options.tryAllMethods - Try all possible methods to delete the cookie
 */
export function deleteCookie(name, options = {}) {
  const {
    path = "/",
    secure = window.location.protocol === "https:",
    sameSite = "lax",
    domain = undefined,
    tryAllMethods = true, // Default to trying all methods
  } = options;

  // Determine if we're in production or development
  const isProduction =
    process.env.NODE_ENV === "production" ||
    window.location.hostname !== "localhost";

  // In production, default to sameSite=none for cross-domain compatibility
  const effectiveSameSite = isProduction && secure ? "none" : sameSite;

  try {
    console.log(
      `Attempting to delete cookie: ${name} (production: ${isProduction})`
    );

    // Get the hostname for domain-based deletion
    const hostname = window.location.hostname;
    // Get domain parts for trying domain and subdomains
    const domainParts = hostname.split(".");

    // Basic deletion approaches that work in most cases
    const basicDeletionApproaches = [
      // Standard approach
      `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      // With secure and SameSite
      `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT${
        secure ? "; secure" : ""
      }; SameSite=${effectiveSameSite}`,
      // With max-age=0 instead of expires
      `${name}=; path=${path}; max-age=0${
        secure ? "; secure" : ""
      }; SameSite=${effectiveSameSite}`,
      // With empty value
      `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    ];

    // Apply all basic approaches
    basicDeletionApproaches.forEach((cookieStr) => {
      document.cookie = cookieStr;
    });

    // If tryAllMethods is true, try more aggressive approaches
    if (tryAllMethods) {
      // Try with different paths
      ["/", "", "*"].forEach((pathValue) => {
        document.cookie = `${name}=; path=${pathValue}; expires=Thu, 01 Jan 1970 00:00:00 GMT${
          secure ? "; secure" : ""
        }; SameSite=${effectiveSameSite}`;
      });

      // Try with explicit domain and various subdomains
      if (domainParts.length >= 2) {
        // Try with the specific domain provided
        if (domain) {
          document.cookie = `${name}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT${
            secure ? "; secure" : ""
          }; SameSite=${effectiveSameSite}`;
        }

        // Try with the current domain
        document.cookie = `${name}=; path=/; domain=${hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT${
          secure ? "; secure" : ""
        }; SameSite=${effectiveSameSite}`;

        // Try with root domain (example.com)
        if (domainParts.length > 2) {
          const rootDomain = domainParts.slice(-2).join(".");
          document.cookie = `${name}=; path=/; domain=.${rootDomain}; expires=Thu, 01 Jan 1970 00:00:00 GMT${
            secure ? "; secure" : ""
          }; SameSite=${effectiveSameSite}`;
        }
      }

      // Try with different SameSite values
      ["none", "lax", "strict"].forEach((sameSiteValue) => {
        if (sameSiteValue === "none" && !secure) return; // Skip none without secure
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${
          secure ? "; secure" : ""
        }; SameSite=${sameSiteValue}`;
      });
    }

    console.log(`Cookie deletion attempts completed for: ${name}`);

    // Verify if the cookie was actually deleted
    setTimeout(() => {
      const cookieExists = document.cookie
        .split("; ")
        .some((c) => c.startsWith(`${name}=`));

      if (cookieExists) {
        console.warn(`⚠️ Cookie ${name} still exists after deletion attempts`);
        // If cookie still exists and we haven't tried all methods, try again with all methods
        if (!tryAllMethods) {
          console.log(`Trying again with all deletion methods for ${name}`);
          deleteCookie(name, { ...options, tryAllMethods: true });
        }
      } else {
        console.log(`✅ Verified: Cookie ${name} successfully deleted`);
      }
    }, 50);
  } catch (error) {
    console.error(`Error deleting cookie ${name}:`, error);

    // Fallback to basic approach if an error occurs
    try {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      console.log(`Fallback cookie deletion attempted for: ${name}`);
    } catch (fallbackError) {
      console.error(
        `Fallback cookie deletion failed for ${name}:`,
        fallbackError
      );
    }
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
