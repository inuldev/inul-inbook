"use client";

import { toast } from "react-hot-toast";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import userStore from "@/store/userStore";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { logAuthDebugInfo, storeAuthError } from "@/lib/authDebug";
import { setCookie } from "@/lib/cookieUtils";
import {
  storeToken,
  storeUserData,
  redirectAfterLogin,
  diagnoseStorageIssues,
} from "@/lib/authUtils";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);
  const { getCurrentUser, setUser, setToken } = userStore();

  // Get the Google auth hook
  const { handleGoogleCallback } = useGoogleAuth();

  // Use a ref to track if the callback has been processed
  const callbackProcessed = useRef(false);

  useEffect(() => {
    // Only process the callback once
    if (callbackProcessed.current) {
      return;
    }
    callbackProcessed.current = true;

    console.log("Google callback page loaded");
    console.log("Current cookies:", document.cookie);
    console.log(
      "Local storage auth_token:",
      localStorage.getItem("auth_token")
    );

    // Diagnosa masalah penyimpanan
    console.log("Diagnosing storage issues...");
    const storageIssues = diagnoseStorageIssues();
    console.log("Storage diagnosis results:", storageIssues);

    if (storageIssues.issues.length > 0) {
      console.warn("Storage issues detected:", storageIssues.issues);
    }

    // Log all search parameters dengan lebih detail
    const allParams = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
      console.log(`Parameter ${key}: ${value}`);
    });
    console.log("All URL parameters:", allParams);

    // Periksa apakah ada parameter yang diperlukan
    console.log("Required parameters check:");
    console.log("- token:", searchParams.has("token") ? "present" : "missing");
    console.log(
      "- userId:",
      searchParams.has("userId") ? "present" : "missing"
    );
    console.log(
      "- success:",
      searchParams.has("success") ? "present" : "missing"
    );
    console.log(
      "- provider:",
      searchParams.has("provider") ? "present" : "missing"
    );

    // Log detailed debug information
    logAuthDebugInfo("google-callback", {
      searchParams: allParams,
      timestamp: new Date().toISOString(),
      cookies: document.cookie ? "present" : "none",
      localStorage: localStorage.getItem("auth_token") ? "present" : "none",
    });

    // Direct token handling from URL (primary method for cross-domain)
    const token = searchParams.get("token");
    console.log(
      "Token from URL:",
      token
        ? `${token.substring(0, 10)}... (length: ${token.length})`
        : "not found"
    );

    // Immediately store token in userStore state if available
    if (token) {
      try {
        userStore.setState({ token, tokenFromUrl: token });
        console.log("Token immediately stored in userStore state");
      } catch (stateError) {
        console.error("Error storing token in userStore state:", stateError);
      }
    }

    // Log all URL parameters for debugging
    console.log("URL search string:", window.location.search);
    console.log("URL hash:", window.location.hash);
    console.log("Full URL:", window.location.href);

    // Log all search parameters individually
    console.log("All searchParams entries:");
    searchParams.forEach((value, key) => {
      console.log(`- ${key}: ${value}`);
    });

    // Try to parse token from full URL if not found in searchParams
    let extractedToken = null;
    if (!token) {
      try {
        // Try from window.location.search
        const urlParams = new URLSearchParams(window.location.search);
        extractedToken = urlParams.get("token");
        console.log(
          "Extracted token from window.location.search:",
          extractedToken
            ? `${extractedToken.substring(0, 10)}... (length: ${
                extractedToken.length
              })`
            : "not found"
        );

        // If still not found, try to extract from the full URL
        if (!extractedToken) {
          console.log("Trying to extract token from full URL...");
          const fullUrl = window.location.href;
          const tokenMatch = fullUrl.match(/[?&]token=([^&]+)/);
          if (tokenMatch && tokenMatch[1]) {
            extractedToken = decodeURIComponent(tokenMatch[1]);
            console.log(
              "Extracted token from regex match:",
              extractedToken
                ? `${extractedToken.substring(0, 10)}... (length: ${
                    extractedToken.length
                  })`
                : "not found"
            );
          }
        }

        // If still not found, try to extract from callbackUrl parameter
        if (!extractedToken) {
          console.log("Checking for callbackUrl parameter...");
          const callbackUrl = searchParams.get("callbackUrl");
          if (callbackUrl) {
            console.log("Found callbackUrl:", callbackUrl);
            try {
              // Try to extract token from callbackUrl
              const callbackParams = new URLSearchParams(
                callbackUrl.includes("?") ? callbackUrl.split("?")[1] : ""
              );
              const callbackToken = callbackParams.get("token");
              if (callbackToken) {
                extractedToken = callbackToken;
                console.log(
                  "Extracted token from callbackUrl:",
                  extractedToken
                    ? `${extractedToken.substring(0, 10)}... (length: ${
                        extractedToken.length
                      })`
                    : "not found"
                );
              }
            } catch (callbackError) {
              console.error(
                "Error extracting token from callbackUrl:",
                callbackError
              );
            }
          }
        }
      } catch (urlError) {
        console.error("Error extracting token from URL:", urlError);
      }
    }

    // Use extracted token if available
    let finalToken = token || extractedToken;

    // If still no token, check localStorage and sessionStorage
    if (!finalToken) {
      console.log("No token found in URL, checking storage...");

      // Check localStorage
      const lsToken = localStorage.getItem("auth_token");
      if (lsToken) {
        console.log("Found token in localStorage");
        finalToken = lsToken;
      } else {
        // Check sessionStorage
        const ssToken = sessionStorage.getItem("auth_token");
        if (ssToken) {
          console.log("Found token in sessionStorage");
          finalToken = ssToken;
        } else {
          // Check backup in sessionStorage
          const backupToken = sessionStorage.getItem("auth_token_backup");
          if (backupToken) {
            console.log("Found token in sessionStorage backup");
            finalToken = backupToken;
          }
        }
      }
    }

    if (finalToken) {
      console.log(
        "Token found in URL parameters:",
        finalToken.substring(0, 10) + "..."
      );

      try {
        // Store token in multiple places for redundancy

        // 0. Store token in userStore state immediately
        try {
          userStore.setState({
            token: finalToken,
            tokenFromUrl: finalToken,
            isAuthenticated: true,
            loading: false,
          });
          console.log("Token immediately stored in userStore state");
        } catch (stateError) {
          console.error("Error storing token in userStore state:", stateError);
        }

        // 1. Store token using utility function
        console.log("Storing token with utility function");
        const tokenStored = storeToken(finalToken);
        console.log(
          "Token storage result:",
          tokenStored ? "success" : "failed"
        );

        // Verifikasi penyimpanan setelah delay (disederhanakan)
        setTimeout(() => {
          console.log("=== STORAGE VERIFICATION ====");
          try {
            console.log(
              "localStorage token:",
              localStorage.getItem("auth_token") ? "present" : "missing"
            );
            console.log(
              "localStorage backup token:",
              localStorage.getItem("auth_token_backup") ? "present" : "missing"
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
            } else {
              console.log(
                "dev_token cookie present:",
                document.cookie.includes("dev_token=") ? "yes" : "no"
              );
            }
          } catch (verifyError) {
            console.error("Storage verification error:", verifyError);
          }
        }, 100);

        // 2. Store in cookies (for same-domain requests) dengan pendekatan yang lebih sederhana
        try {
          const isSecure = window.location.protocol === "https:";
          const isProduction =
            process.env.NODE_ENV === "production" ||
            window.location.hostname !== "localhost";

          console.log("Cookie settings:", {
            isSecure,
            isProduction,
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            cookiesEnabled: navigator.cookieEnabled,
          });

          // Hapus cookie lama terlebih dahulu jika ada
          document.cookie =
            "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie =
            "auth_status=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie =
            "dev_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie =
            "dev_auth_status=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

          // Gunakan pendekatan yang sederhana berdasarkan environment
          if (isProduction) {
            // Production environment: use token cookie
            document.cookie = `token=${encodeURIComponent(
              token
            )}; path=/; max-age=${30 * 24 * 60 * 60}${
              isSecure ? "; Secure" : ""
            }; SameSite=${isProduction ? "none" : "lax"}`;
            document.cookie = `auth_status=logged_in; path=/; max-age=${
              30 * 24 * 60 * 60
            }${isSecure ? "; Secure" : ""}; SameSite=lax`;
            console.log("Production cookies set");
          } else {
            // Development environment: use dev_token cookie
            document.cookie = `dev_token=${encodeURIComponent(
              token
            )}; path=/; max-age=${30 * 24 * 60 * 60}${
              isSecure ? "; Secure" : ""
            }; SameSite=lax`;
            document.cookie = `dev_auth_status=logged_in; path=/; max-age=${
              30 * 24 * 60 * 60
            }${isSecure ? "; Secure" : ""}; SameSite=lax`;
            console.log("Development cookies set");
          }

          // Verifikasi apakah cookie berhasil diatur
          setTimeout(() => {
            const allCookies = document.cookie;
            console.log("All cookies after setting:", allCookies);

            if (isProduction) {
              console.log(
                "Token cookie present:",
                allCookies.includes("token=") ? "yes" : "no"
              );
              console.log(
                "Auth status cookie present:",
                allCookies.includes("auth_status=") ? "yes" : "no"
              );
            } else {
              console.log(
                "Dev token cookie present:",
                allCookies.includes("dev_token=") ? "yes" : "no"
              );
              console.log(
                "Dev auth status cookie present:",
                allCookies.includes("dev_auth_status=") ? "yes" : "no"
              );
            }
          }, 100);

          console.log("Cookie setting completed");
        } catch (cookieError) {
          console.error("Error in cookie setting process:", cookieError);
        }

        console.log("Cookies set in browser");

        // 3. Store in Zustand state
        try {
          setToken(finalToken);
          console.log("Token stored in Zustand state");

          // Verifikasi state
          setTimeout(() => {
            const storeState = userStore.getState();
            console.log("Zustand state after setToken:", {
              token: storeState.token ? "present" : "missing",
              isAuthenticated: storeState.isAuthenticated,
            });
          }, 100);
        } catch (stateError) {
          console.error("Error storing token in Zustand state:", stateError);
        }

        // Get user data from URL parameters if available
        const userId = searchParams.get("userId");
        const username = searchParams.get("username");
        const email = searchParams.get("email");
        const profilePicture = searchParams.get("profilePicture");

        if (userId && email) {
          const userData = {
            _id: userId,
            username: username || "",
            email: email || "",
            profilePicture: profilePicture || "",
          };

          // Store user data using utility function
          console.log("Storing user data with utility function");
          const userDataStored = storeUserData(userData);
          console.log(
            "User data storage result:",
            userDataStored ? "success" : "failed"
          );

          // Set user in Zustand state
          try {
            setUser(userData);
            console.log("User data stored in Zustand state");

            // Verifikasi state
            setTimeout(() => {
              const storeState = userStore.getState();
              console.log("Zustand state after setUser:", {
                user: storeState.user ? "present" : "missing",
                isAuthenticated: storeState.isAuthenticated,
                userId: storeState.user?._id,
              });

              // Jika user tidak ada di state, coba set ulang
              if (!storeState.user) {
                console.warn("User not found in state, trying to set again");
                try {
                  setUser(userData);
                  setToken(finalToken); // Set token lagi untuk memastikan

                  // Verifikasi lagi
                  setTimeout(() => {
                    const retryState = userStore.getState();
                    console.log("Zustand state after retry:", {
                      user: retryState.user ? "present" : "missing",
                      isAuthenticated: retryState.isAuthenticated,
                    });
                  }, 100);
                } catch (retryError) {
                  console.error("Error in retry setUser:", retryError);
                }
              }
            }, 100);
          } catch (stateError) {
            console.error(
              "Error storing user data in Zustand state:",
              stateError
            );
          }

          console.log("User data stored from URL parameters");

          // Show success toast
          toast.success(`Welcome, ${username || email}!`);

          // Redirect to home page after a short delay dengan penanganan error yang lebih baik
          try {
            // Simpan status autentikasi berhasil di sessionStorage
            sessionStorage.setItem("auth_success", "true");
            sessionStorage.setItem("auth_timestamp", Date.now().toString());

            // Simpan token di sessionStorage sebagai fallback tambahan
            sessionStorage.setItem("auth_token_backup", finalToken);

            // Verifikasi sekali lagi apakah token dan user data tersimpan
            const finalCheck = {
              localStorage: {
                token: localStorage.getItem("auth_token")
                  ? "present"
                  : "missing",
                user: localStorage.getItem("auth_user") ? "present" : "missing",
              },
              sessionStorage: {
                token: sessionStorage.getItem("auth_token")
                  ? "present"
                  : "missing",
                tokenBackup: sessionStorage.getItem("auth_token_backup")
                  ? "present"
                  : "missing",
              },
              cookies: document.cookie,
              zustandState: {
                token: userStore.getState().token ? "present" : "missing",
                user: userStore.getState().user ? "present" : "missing",
                isAuthenticated: userStore.getState().isAuthenticated,
              },
            };
            console.log("Final authentication state check:", finalCheck);

            // Jika token tidak ada di localStorage tapi ada di sessionStorage, coba salin
            if (
              !localStorage.getItem("auth_token") &&
              sessionStorage.getItem("auth_token")
            ) {
              try {
                localStorage.setItem(
                  "auth_token",
                  sessionStorage.getItem("auth_token")
                );
                console.log("Copied token from sessionStorage to localStorage");
              } catch (copyError) {
                console.error(
                  "Error copying token to localStorage:",
                  copyError
                );
              }
            }

            // Dapatkan URL redirect
            let redirectUrl = "/";
            try {
              redirectUrl = sessionStorage.getItem("loginRedirectUrl") || "/";
              console.log("Will redirect to:", redirectUrl);

              // Jika redirectUrl adalah /google-callback, ubah ke /
              if (redirectUrl.includes("/google-callback")) {
                console.log("Changing redirect from /google-callback to /");
                redirectUrl = "/";
              }
            } catch (redirectUrlError) {
              console.error("Error getting redirect URL:", redirectUrlError);
            }

            // Lakukan redirect setelah delay
            setTimeout(async () => {
              try {
                // Periksa sekali lagi status autentikasi
                const authState = userStore.getState();
                const authStatus = authState.isAuthenticated;
                const hasUser = !!authState.user;
                console.log("Authentication status before redirect:", {
                  isAuthenticated: authStatus,
                  hasUser,
                });

                if (!authStatus || !hasUser) {
                  console.warn(
                    "Not fully authenticated before redirect, trying to set state again"
                  );
                  setToken(finalToken);
                  setUser(userData);

                  // Jika masih tidak ada user data, coba ambil dari API
                  if (!hasUser) {
                    console.log(
                      "No user data in state, trying to fetch from API"
                    );
                    try {
                      await getCurrentUser();
                      console.log(
                        "Successfully fetched user data from API before redirect"
                      );
                    } catch (apiError) {
                      console.error(
                        "Error fetching user data from API before redirect:",
                        apiError
                      );
                    }
                  }
                }

                console.log("Redirecting to:", redirectUrl);

                // Gunakan window.location.href langsung untuk redirect yang lebih kuat
                // dan menghindari masalah dengan router.push
                console.log(
                  "Using direct window.location.href for stronger redirect"
                );
                window.location.href = redirectUrl;

                // Fallback: Jika window.location.href gagal (sangat jarang terjadi)
                setTimeout(() => {
                  if (window.location.pathname.includes("google-callback")) {
                    console.log(
                      "window.location.href failed, trying router.push as fallback"
                    );
                    try {
                      router.push(redirectUrl);
                    } catch (routerError) {
                      console.error(
                        "Router.push fallback also failed:",
                        routerError
                      );
                      // Coba reload halaman sebagai upaya terakhir
                      window.location.reload();
                    }
                  }
                }, 2000);
              } catch (routerError) {
                console.error("Error during router.push:", routerError);
                // Fallback ke window.location.href
                try {
                  window.location.href = redirectUrl;
                } catch (locationError) {
                  console.error(
                    "Error during location redirect:",
                    locationError
                  );
                }
              }
            }, 1500);
          } catch (redirectError) {
            console.error("Error during redirect setup:", redirectError);
            // Fallback langsung ke home page
            setTimeout(() => {
              window.location.href = "/";
            }, 2000);
          }

          return;
        }
      } catch (tokenError) {
        console.error("Error handling token from URL:", tokenError);
        storeAuthError("Token handling error", {
          error: tokenError.message,
          stack: tokenError.stack,
        });
      }
    }

    // Fallback: Handle the Google OAuth callback using the hook
    const processCallback = async () => {
      try {
        const success = await handleGoogleCallback(
          searchParams,
          getCurrentUser,
          // Success callback dengan penanganan error yang lebih baik
          () => {
            console.log(
              "Google authentication successful, redirecting to home"
            );
            setProcessing(false);
            toast.success("Login successful!");

            // Simpan status autentikasi berhasil di sessionStorage
            try {
              sessionStorage.setItem("auth_success", "true");
              sessionStorage.setItem("auth_timestamp", Date.now().toString());
            } catch (sessionError) {
              console.error(
                "Error storing auth success in sessionStorage:",
                sessionError
              );
            }

            // Lakukan redirect setelah delay
            setTimeout(() => {
              try {
                // Dapatkan URL redirect
                const redirectUrl =
                  sessionStorage.getItem("loginRedirectUrl") || "/";
                console.log("Will redirect to:", redirectUrl);

                // Gunakan utility function untuk redirect
                console.log("Using redirectAfterLogin utility function");
                redirectAfterLogin();
              } catch (redirectError) {
                console.error("Error during redirect:", redirectError);
                // Fallback ke window.location.href
                window.location.href = "/";
              }
            }, 1500);
          },
          // Error callback
          (errorMessage) => {
            console.error("Google authentication failed:", errorMessage);
            setError(errorMessage);
            setProcessing(false);
            toast.error("Login failed: " + errorMessage);

            // Store the error for debugging
            storeAuthError(errorMessage, {
              source: "google-callback",
              searchParams: Object.fromEntries(searchParams.entries()),
              cookies: document.cookie.split("; ").reduce((obj, cookie) => {
                const [name, value] = cookie.split("=");
                if (name) obj[name] = value;
                return obj;
              }, {}),
            });

            // Try to get the redirect URL from session storage
            let redirectUrl = "/user-login";
            try {
              redirectUrl =
                sessionStorage.getItem("loginRedirectUrl") || "/user-login";
            } catch (sessionError) {
              console.error(
                "Error getting redirect URL from sessionStorage:",
                sessionError
              );
            }
            console.log("Will redirect to:", redirectUrl);

            // Simpan status error di sessionStorage
            try {
              sessionStorage.setItem("auth_error", errorMessage);
              sessionStorage.setItem(
                "auth_error_timestamp",
                Date.now().toString()
              );
            } catch (sessionError) {
              console.error(
                "Error storing auth error in sessionStorage:",
                sessionError
              );
            }

            setTimeout(() => {
              try {
                // Use utility function for redirect with custom URL
                console.log("Redirecting to login page after error");
                redirectAfterLogin(redirectUrl);
              } catch (redirectError) {
                console.error("Error during error redirect:", redirectError);
                // Fallback ke window.location.href
                window.location.href = "/user-login";
              }
            }, 3000);
          }
        );

        if (!success) {
          console.log("Google authentication was not successful");
          setProcessing(false);
          setError("Authentication failed. Please try again.");

          // Simpan status error di sessionStorage
          try {
            sessionStorage.setItem("auth_error", "Authentication failed");
            sessionStorage.setItem(
              "auth_error_timestamp",
              Date.now().toString()
            );
          } catch (sessionError) {
            console.error(
              "Error storing auth error in sessionStorage:",
              sessionError
            );
          }

          setTimeout(() => {
            try {
              router.push("/user-login");

              // Fallback: Jika router.push gagal, coba dengan window.location
              setTimeout(() => {
                if (window.location.pathname.includes("google-callback")) {
                  console.log("Router.push failed, trying window.location");
                  window.location.href = "/user-login";
                }
              }, 1000);
            } catch (redirectError) {
              console.error("Error during error redirect:", redirectError);
              // Fallback ke window.location.href
              window.location.href = "/user-login";
            }
          }, 3000);
        }
      } catch (callbackError) {
        console.error("Error in Google callback processing:", callbackError);
        setProcessing(false);
        setError("An unexpected error occurred. Please try again.");

        // Simpan error untuk debugging
        storeAuthError("Callback processing error", {
          error: callbackError.message,
          stack: callbackError.stack,
        });

        // Simpan status error di sessionStorage
        try {
          sessionStorage.setItem("auth_error", "Callback processing error");
          sessionStorage.setItem("auth_error_timestamp", Date.now().toString());
          sessionStorage.setItem("auth_error_details", callbackError.message);
        } catch (sessionError) {
          console.error(
            "Error storing auth error in sessionStorage:",
            sessionError
          );
        }

        setTimeout(() => {
          try {
            router.push("/user-login");

            // Fallback: Jika router.push gagal, coba dengan window.location
            setTimeout(() => {
              if (window.location.pathname.includes("google-callback")) {
                console.log("Router.push failed, trying window.location");
                window.location.href = "/user-login";
              }
            }, 1000);
          } catch (redirectError) {
            console.error("Error during error redirect:", redirectError);
            // Fallback ke window.location.href
            window.location.href = "/user-login";
          }
        }, 3000);
      }
    };

    processCallback();
    // Remove dependencies that might cause re-renders and infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">
          {processing
            ? "Processing Google Login"
            : error
            ? "Authentication Failed"
            : "Authentication Successful"}
        </h1>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">
            <p>{error}</p>
            <p className="mt-2 text-sm">Redirecting to login page...</p>
          </div>
        ) : processing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Completing your login, please wait...</p>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg mb-4">
            <p>Login successful!</p>
            <p className="mt-2 text-sm">Redirecting to home page...</p>
          </div>
        )}
      </div>
    </div>
  );
}
