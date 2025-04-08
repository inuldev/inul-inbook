import { NextResponse } from "next/server";

/**
 * This route proxies the Google OAuth initiation to the backend
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

    // Construct the full URL to the backend
    const url = `${backendUrl}/api/auth/google`;

    console.log(`Proxying Google OAuth request to: ${url}`);
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    );
    console.log("Environment:", {
      NODE_ENV: process.env.NODE_ENV,
      BACKEND_URL: process.env.BACKEND_URL || "(not set)",
      NEXT_PUBLIC_BACKEND_URL:
        process.env.NEXT_PUBLIC_BACKEND_URL || "(not set)",
    });

    // Add debug info to the URL
    const debugUrl = `${url}?debug=true&source=next-api-route&timestamp=${Date.now()}`;

    // Redirect to the backend Google OAuth endpoint
    return NextResponse.redirect(debugUrl);
  } catch (error) {
    console.error("Google OAuth proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Google OAuth proxy error",
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
      }
    );
  }
}
