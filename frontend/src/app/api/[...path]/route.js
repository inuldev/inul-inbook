import { NextResponse } from "next/server";

/**
 * This is a catch-all API route that proxies requests to the backend
 * It's useful for Vercel hobby plan deployment where we can't have separate frontend and backend
 */
export async function GET(request, { params }) {
  return handleRequest(request, params, "GET");
}

export async function POST(request, { params }) {
  return handleRequest(request, params, "POST");
}

export async function PUT(request, { params }) {
  return handleRequest(request, params, "PUT");
}

export async function DELETE(request, { params }) {
  return handleRequest(request, params, "DELETE");
}

/**
 * Helper function to handle all request methods
 */
async function handleRequest(request, { path }, method) {
  try {
    // Get the backend URL from environment variables
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://inul-inbook-backend.vercel.app";

    // Construct the full URL to the backend
    const url = `${backendUrl}/api/${path.join("/")}${
      request.url.includes("?")
        ? request.url.substring(request.url.indexOf("?"))
        : ""
    }`;

    // Get cookies from the request to maintain sessions
    const cookieHeader = request.headers.get("cookie") || "";

    // Prepare headers for the backend request
    const headers = new Headers();
    headers.set(
      "Content-Type",
      request.headers.get("Content-Type") || "application/json"
    );
    headers.set("Cookie", cookieHeader);

    // Forward the request to the backend
    const backendResponse = await fetch(url, {
      method,
      headers,
      body:
        method !== "GET" && method !== "HEAD"
          ? await request.text()
          : undefined,
      redirect: "follow",
    });

    // Get the response data
    const data = await backendResponse.text();

    // Prepare the response headers
    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Type",
      backendResponse.headers.get("Content-Type") || "application/json"
    );

    // Forward all cookies from the backend response
    const setCookieHeader = backendResponse.headers.get("set-cookie");
    if (setCookieHeader) {
      // Process the cookie to ensure it works on the same domain
      // Remove domain attribute if present to use the current domain
      const processedCookie = setCookieHeader.replace(/; domain=[^;]+/gi, "");
      responseHeaders.set("Set-Cookie", processedCookie);

      console.log("Forwarding cookies:", processedCookie);
    }

    // Return the response
    return new NextResponse(data, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("API proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Set the runtime to edge for better performance
export const runtime = "edge";
