import { NextResponse } from "next/server";

// Mark this route as dynamic to prevent static prerendering
export const dynamic = "force-dynamic";

/**
 * This route proxies the Google OAuth callback to the backend
 */
export async function GET(request) {
  try {
    // Get the backend URL from environment variables
    // Make sure to handle empty strings properly
    let backendUrl = process.env.BACKEND_URL;
    if (
      !backendUrl ||
      backendUrl === '""' ||
      backendUrl === "''" ||
      backendUrl === ""
    ) {
      // Use the hardcoded fallback URL only if no valid URL is provided
      backendUrl = "https://inul-inbook-backend.vercel.app";
    }

    // Ensure the URL doesn't have trailing slashes that could cause issues
    backendUrl = backendUrl.replace(/\/$/, "");

    console.log("Raw BACKEND_URL:", JSON.stringify(process.env.BACKEND_URL));
    console.log("Processed backendUrl:", backendUrl);

    // Get the query parameters from the request URL
    const url = new URL(request.url);
    const queryParams = url.search;

    // Construct the full URL to the backend
    const backendCallbackUrl = `${backendUrl}/api/auth/google/callback${queryParams}`;

    console.log(`Proxying Google OAuth callback to: ${backendCallbackUrl}`);

    // Log request details
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    );
    console.log("Request cookies:", request.headers.get("cookie") || "none");
    console.log("Query parameters:", queryParams);

    // Make the request to the backend
    const response = await fetch(backendCallbackUrl, {
      method: "GET",
      headers: {
        Cookie: request.headers.get("cookie") || "",
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "X-Real-IP": request.headers.get("x-real-ip") || "",
        "User-Agent": request.headers.get("user-agent") || "",
        Origin: request.headers.get("origin") || new URL(request.url).origin,
        Referrer:
          request.headers.get("referrer") || new URL(request.url).origin,
      },
      redirect: "manual", // Don't follow redirects automatically
      // Increase timeout for potentially slow responses
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    // Log response details
    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    // Get the location header from the response
    const location = response.headers.get("location");
    console.log("Location header:", location || "none");

    if (location) {
      // If the backend redirected, we should redirect too
      console.log(`Backend redirected to: ${location}`);

      // Add debug info to the redirect URL
      let redirectUrl = location;
      try {
        const locationUrl = new URL(location);
        locationUrl.searchParams.append("debug_source", "callback_proxy");
        locationUrl.searchParams.append("debug_time", Date.now().toString());
        redirectUrl = locationUrl.toString();
        console.log(`Enhanced redirect URL: ${redirectUrl}`);
      } catch (urlError) {
        console.error("Error enhancing redirect URL:", urlError);
      }

      return NextResponse.redirect(redirectUrl);
    }

    // If there's no redirect, return the response as is
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "text/html",
      },
    });
  } catch (error) {
    console.error("Google OAuth callback proxy error:", error);
    // Use absolute URL for redirect with detailed error information
    const baseUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL || "https://inul2-inbook.vercel.app";

    // Include error details in the redirect URL for better debugging
    const errorMessage = encodeURIComponent(
      `Authentication failed: ${error.message || "Unknown error"}`
    );

    console.error("Detailed OAuth error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.redirect(
      `${baseUrl}/user-login?error=${errorMessage}&source=callback_proxy&time=${Date.now()}`
    );
  }
}
