import { NextResponse } from "next/server";

/**
 * This route proxies the Google OAuth callback to the backend
 */
export async function GET(request) {
  try {
    // Get the backend URL from environment variables
    // Make sure to handle empty strings properly
    let backendUrl = process.env.BACKEND_URL;
    if (!backendUrl || backendUrl === '""' || backendUrl === "''") {
      backendUrl = "https://inul-inbook-backend.vercel.app";
    }

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
      },
      redirect: "manual", // Don't follow redirects automatically
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
    return NextResponse.redirect("/user-login?error=Authentication+failed");
  }
}
