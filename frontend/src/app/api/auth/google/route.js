import { NextResponse } from "next/server";

// Mark this route as dynamic to prevent static prerendering
export const dynamic = "force-dynamic";

/**
 * This route proxies the Google OAuth initiation to the backend
 */
export async function GET(request) {
  try {
    // Get the backend URL from environment variables
    let backendUrl = process.env.BACKEND_URL;
    if (!backendUrl || backendUrl.trim() === "") {
      console.warn("BACKEND_URL is not set. Using fallback URL.");
      backendUrl = "https://inul-inbook-backend.vercel.app";
    }

    // Ensure the URL doesn't have trailing slashes
    backendUrl = backendUrl.replace(/\/$/, "");

    console.log("Using backend URL:", backendUrl);

    // Construct the full URL to the backend
    const state = Buffer.from(
      JSON.stringify({
        timestamp: Date.now(),
        source: "next-api-route",
        origin: request.headers.get("origin") || new URL(request.url).origin,
        referer: request.headers.get("referer") || "",
      })
    ).toString("base64");

    const url = `${backendUrl}/api/auth/google?state=${encodeURIComponent(
      state
    )}`;

    console.log("Redirecting to backend URL:", url);

    // Redirect to the backend Google OAuth endpoint
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Google OAuth proxy error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Redirect to login page with a generic error message
    const frontendUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL || new URL(request.url).origin;

    return NextResponse.redirect(
      `${frontendUrl}/user-login?error=${encodeURIComponent(
        "Authentication service is currently unavailable. Please try again later."
      )}`
    );
  }
}

// /**
//  * This route proxies the Google OAuth initiation to the backend
//  */
// export async function GET(request) {
//   try {
//     // Get the backend URL from environment variables
//     // Make sure to handle empty strings properly
//     let backendUrl = process.env.BACKEND_URL;
//     if (
//       !backendUrl ||
//       backendUrl === '""' ||
//       backendUrl === "''" ||
//       backendUrl === ""
//     ) {
//       // Use the hardcoded fallback URL only if no valid URL is provided
//       backendUrl = "https://inul-inbook-backend.vercel.app";
//     }

//     // Ensure the URL doesn't have trailing slashes that could cause issues
//     backendUrl = backendUrl.replace(/\/$/, "");

//     console.log("Raw BACKEND_URL:", JSON.stringify(process.env.BACKEND_URL));
//     console.log("Processed backendUrl:", backendUrl);

//     // Construct the full URL to the backend
//     const url = `${backendUrl}/api/auth/google`;

//     console.log(`Proxying Google OAuth request to: ${url}`);
//     console.log(
//       "Request headers:",
//       Object.fromEntries(request.headers.entries())
//     );
//     console.log("Environment:", {
//       NODE_ENV: process.env.NODE_ENV,
//       BACKEND_URL: process.env.BACKEND_URL || "(not set)",
//       NEXT_PUBLIC_BACKEND_URL:
//         process.env.NEXT_PUBLIC_BACKEND_URL || "(not set)",
//     });

//     // Add debug info and state parameter to the URL
//     // The state parameter is important for security and will be returned in the callback
//     const state = Buffer.from(
//       JSON.stringify({
//         timestamp: Date.now(),
//         source: "next-api-route",
//         origin: request.headers.get("origin") || new URL(request.url).origin,
//         referer: request.headers.get("referer") || "",
//       })
//     ).toString("base64");

//     const debugUrl = `${url}?debug=true&source=next-api-route&timestamp=${Date.now()}&state=${encodeURIComponent(
//       state
//     )}`;

//     console.log(`Enhanced OAuth URL with state parameter: ${debugUrl}`);

//     // Redirect to the backend Google OAuth endpoint
//     return NextResponse.redirect(debugUrl);
//   } catch (error) {
//     console.error("Google OAuth proxy error:", error);
//     // Get the frontend URL for redirection
//     const frontendUrl =
//       process.env.NEXT_PUBLIC_FRONTEND_URL || new URL(request.url).origin;

//     // Log detailed error information
//     console.error("Detailed OAuth initiation error:", {
//       message: error.message,
//       stack: error.stack,
//       timestamp: new Date().toISOString(),
//     });

//     // Redirect to login page with error instead of returning JSON
//     // This provides a better user experience
//     return NextResponse.redirect(
//       `${frontendUrl}/user-login?error=${encodeURIComponent(
//         "Failed to connect to authentication service"
//       )}&source=oauth_init&time=${Date.now()}`
//     );
//   }
// }
