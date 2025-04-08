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
  } = options;

  let cookie = `${name}=${encodeURIComponent(value)}; path=${path}; max-age=${maxAge}`;
  
  if (secure) {
    cookie += "; secure";
  }
  
  if (sameSite) {
    cookie += `; samesite=${sameSite}`;
  }
  
  document.cookie = cookie;
  console.log(`Cookie set: ${name} (${cookie.substring(0, 50)}...)`);
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
  } = options;
  
  // Set expiration to the past
  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  
  // Also try with secure and samesite attributes
  if (secure || sameSite) {
    let cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    
    if (secure) {
      cookie += "; secure";
    }
    
    if (sameSite) {
      cookie += `; samesite=${sameSite}`;
    }
    
    document.cookie = cookie;
  }
  
  console.log(`Cookie deleted: ${name}`);
}

/**
 * Check if a cookie exists
 * @param {string} name - The name of the cookie to check
 * @returns {boolean} - Whether the cookie exists
 */
export function hasCookie(name) {
  return document.cookie.split("; ").some(cookie => cookie.startsWith(`${name}=`));
}

/**
 * Parse all cookies into an object
 * @returns {Object} - An object with all cookies
 */
export function getAllCookies() {
  const cookies = {};
  document.cookie.split("; ").forEach(cookie => {
    const [name, value] = cookie.split("=");
    if (name) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}
