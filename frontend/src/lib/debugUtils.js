/**
 * Debug utilities for troubleshooting authentication and API issues
 */

// Enable verbose logging in development or when debug flag is set
const VERBOSE_DEBUG = process.env.NODE_ENV !== 'production' || 
                     process.env.NEXT_PUBLIC_DEBUG === 'true';

/**
 * Log debug information with consistent formatting
 */
export function debugLog(area, message, data = null) {
  if (!VERBOSE_DEBUG && process.env.NODE_ENV === 'production') {
    // In production, only log to console if explicitly enabled
    return;
  }
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${area.toUpperCase()}]`;
  
  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

/**
 * Log network request details
 */
export function logRequest(method, url, options = {}) {
  debugLog('network', `${method} ${url}`, {
    headers: options.headers || {},
    body: options.body || null,
  });
}

/**
 * Log network response details
 */
export function logResponse(url, response, data = null) {
  debugLog('network', `Response from ${url}`, {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries([...response.headers.entries()]),
    data: data,
  });
}

/**
 * Log authentication events
 */
export function logAuth(action, details = null) {
  debugLog('auth', action, details);
}

/**
 * Get all cookies as an object for debugging
 */
export function getAllCookiesDebug() {
  if (typeof document === 'undefined') return {};
  
  return document.cookie.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name) cookies[name] = value;
    return cookies;
  }, {});
}

/**
 * Get all localStorage items as an object for debugging
 */
export function getLocalStorageDebug() {
  if (typeof window === 'undefined') return {};
  
  const items = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    items[key] = localStorage.getItem(key);
  }
  return items;
}

/**
 * Log the current authentication state
 */
export function logAuthState() {
  debugLog('auth', 'Current auth state', {
    cookies: getAllCookiesDebug(),
    localStorage: getLocalStorageDebug(),
    url: typeof window !== 'undefined' ? window.location.href : null,
  });
}

/**
 * Create a debug button that shows current auth state
 * Only visible in development or when debug is enabled
 */
export function DebugButton() {
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_DEBUG) {
    return null;
  }
  
  return (
    <button
      onClick={() => {
        logAuthState();
        alert('Auth state logged to console');
      }}
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 9999,
        background: '#ff5722',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '8px 12px',
        fontSize: '12px',
        cursor: 'pointer',
      }}
    >
      Debug Auth
    </button>
  );
}
