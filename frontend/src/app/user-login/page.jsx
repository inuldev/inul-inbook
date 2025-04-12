"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import {
  logAuthDebugInfo,
  getStoredAuthError,
  clearStoredAuthError,
} from "@/lib/authDebug";
import {
  isAuthenticated,
  getToken,
  getUserData,
  redirectAfterLogin,
} from "@/lib/authUtils";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ButtonSpinner } from "@/components/ui/spinner";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import userStore from "@/store/userStore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading, error, clearErrors } = userStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  // Ref untuk melacak apakah redirect handler sudah dijalankan
  const redirectHandlerRun = useRef(false);

  // Clear errors when user changes input
  const handleInputChange = (e, setter) => {
    // Clear any form errors when user starts typing
    if (formError) setFormError("");
    if (error) clearErrors();

    // Update the input value
    setter(e.target.value);
  };

  // Check for auth errors on page load and handle redirect if needed
  useEffect(() => {
    // Coba redirect jika sudah authenticated
    if (!redirectHandlerRun.current && typeof window !== "undefined") {
      redirectHandlerRun.current = true;

      // Periksa apakah pengguna sudah login menggunakan utility function
      const authenticated = isAuthenticated();
      const token = getToken();
      const userData = getUserData();

      console.log("Auth check in login page using utility functions:", {
        authenticated,
        hasToken: !!token,
        hasUserData: !!userData,
      });

      // Jika pengguna sudah login, redirect ke home page
      if (authenticated) {
        console.log("Found token and user data, redirecting to home page");
        setRedirecting(true);

        // Coba set state di Zustand store
        try {
          let userData;
          try {
            userData = JSON.parse(
              localStorage.getItem("auth_user") ||
                sessionStorage.getItem("auth_user") ||
                "{}"
            );
          } catch (parseError) {
            console.error("Error parsing user data:", parseError);
            userData = {};
          }

          const token =
            localStorage.getItem("auth_token") ||
            sessionStorage.getItem("auth_token") ||
            window.authToken;

          if (userData && token) {
            userStore.setState({
              user: userData,
              token: token,
              isAuthenticated: true,
              loading: false,
              error: null,
            });

            console.log("Set user data and token in store");
          }
        } catch (storeError) {
          console.error("Error setting store state:", storeError);
        }

        // Redirect ke home page menggunakan utility function
        setTimeout(() => {
          redirectAfterLogin();
        }, 500);

        return;
      }
    }
    // Check for callbackUrl parameter that points to google-callback
    const callbackUrl = searchParams.get("callbackUrl");
    if (callbackUrl && callbackUrl.includes("/google-callback")) {
      console.log(
        "Detected redirect to login with google-callback as callbackUrl"
      );
      console.log("This might indicate a failed Google OAuth flow");

      // Periksa apakah pengguna sudah login menggunakan utility function
      const authenticated = isAuthenticated();
      const token = getToken();
      const userData = getUserData();

      console.log("Auth check in login page using utility functions:", {
        authenticated,
        hasToken: !!token,
        hasUserData: !!userData,
      });

      // Jika pengguna sudah login, redirect ke home page
      if (authenticated) {
        console.log("Found token in storage, attempting to use it");

        // Token sudah ditemukan, tidak perlu menyalin dari sumber lain

        // Jika sudah authenticated, berarti token dan user data sudah ada
        console.log("User is authenticated, redirecting to home page");

        // Redirect ke home page menggunakan utility function
        setTimeout(() => {
          redirectAfterLogin();
        }, 100);
        return;
      }

      // Jika tidak ada token, tampilkan pesan error
      setFormError(
        "Google login failed. Please try again or use email/password login."
      );
    }

    // Check for error parameter in URL
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setFormError(`Authentication error: ${errorParam}`);
    }

    // Check for stored auth errors
    const storedError = getStoredAuthError();
    if (storedError && !errorParam) {
      setFormError(
        `${storedError.message} (${new Date(
          storedError.timestamp
        ).toLocaleTimeString()})`
      );
      // Clear the stored error after displaying it
      clearStoredAuthError();
    }

    // Log debug info
    logAuthDebugInfo("login-page", {
      searchParams: Object.fromEntries(searchParams.entries()),
    });
  }, [searchParams, router]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Clear previous errors
    clearErrors();
    setFormError("");

    // Validate form
    if (!email.trim() || !password.trim()) {
      setFormError("Please fill in all fields");
      return;
    }

    try {
      // Add a delay to ensure we can check cookies after they're set
      const response = await login({ email, password });
      console.log("Login successful:", response);

      // Show loading overlay during redirection
      setRedirecting(true);

      // Verify authentication using utility functions
      setTimeout(() => {
        const authenticated = isAuthenticated();
        console.log("Authentication check after login:", authenticated);

        if (authenticated) {
          console.log("Authentication successful, redirecting to home page");
          // Use utility function for redirect
          redirectAfterLogin();
        } else {
          console.warn(
            "Authentication failed after login - retrying navigation"
          );
          // Try to navigate anyway as fallback
          router.push("/");
        }
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      // Error is already set in the store
    }
  };

  // Get the Google auth hook
  const { initiateGoogleLogin, error: googleError } = useGoogleAuth();

  const handleGoogleLogin = () => {
    // Clear any existing errors
    clearErrors();
    setFormError("");

    // Set loading state
    setRedirecting(true);

    // Initiate Google login
    const success = initiateGoogleLogin(clearErrors);

    // If there was an immediate error (rare), handle it
    if (!success && googleError) {
      setFormError(googleError);
      setRedirecting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-background text-foreground">
      {redirecting ? (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Redirecting...</h2>
          <p className="text-muted-foreground mb-4">
            You are already authenticated. Redirecting to home page...
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      ) : (
        <Card className="w-full max-w-md border-border bg-card text-card-foreground">
          <CardHeader className="space-y-1">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">Login</CardTitle>
              <ThemeToggle />
            </div>
          </CardHeader>
          <CardContent>
            {(error || formError) && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError || error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => handleInputChange(e, setEmail)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => handleInputChange(e, setPassword)}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <ButtonSpinner />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <ButtonSpinner />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 mr-2"
                >
                  <path
                    fill="#EA4335"
                    d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"
                  />
                  <path
                    fill="#34A853"
                    d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2970142 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1272727,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"
                  />
                </svg>
              )}
              {!loading && "Sign in with Google"}
            </Button>

            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link
                href="/user-register"
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Register
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
