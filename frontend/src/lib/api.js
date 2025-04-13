import config from "./config";

/**
 * Utility function for making API requests with environment-specific configurations
 * @param {string} endpoint - API endpoint (without the base URL)
 * @param {Object} options - Fetch options
 * @param {string} timeoutType - Type of timeout to use (short, medium, long, upload)
 * @returns {Promise<any>} - Response data
 */
export async function apiRequest(
  endpoint,
  options = {},
  timeoutType = "medium"
) {
  // For Vercel deployment, handle API routes differently
  let url;

  // Check if we're running on Vercel production
  const isVercelProduction =
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    !window.location.hostname.includes("vercel.app");

  if (isVercelProduction && endpoint.startsWith("/api/")) {
    // In production, API calls can be made to the same domain
    url = endpoint;
  } else {
    // In development or preview, use the backend URL
    url = `${config.backendUrl}${
      endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    }`;
  }

  // Set default headers if not provided
  const headers = options.headers || {};

  // Check if body is FormData - note the correct instanceof check
  const isFormData = options.body instanceof FormData;

  // Only set Content-Type for non-FormData requests
  // For FormData, browser will automatically set the correct Content-Type with boundary
  if (!headers["Content-Type"] && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Log for debugging
  if (config.isDevelopment) {
    console.log(
      `Request body type: ${isFormData ? "FormData" : typeof options.body}`
    );
    if (isFormData && options.body) {
      console.log("FormData contains:", Array.from(options.body.entries()));
    }
  }

  // Set timeout based on request type
  const timeout = config.apiTimeouts[timeoutType] || config.apiTimeouts.medium;

  // Merge options with defaults
  const fetchOptions = {
    ...options,
    headers,
    credentials: "include",
    timeout,
  };

  try {
    // Add request logging in development
    if (config.isDevelopment) {
      console.log(`🔄 API Request: ${options.method || "GET"} ${url}`);
      if (options.body && typeof options.body === "string") {
        try {
          console.log("Request Body:", JSON.parse(options.body));
        } catch (e) {
          // Not JSON, ignore
        }
      }
    }

    const response = await fetch(url, fetchOptions);

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();

      // Log response in development
      if (config.isDevelopment) {
        console.log(`✅ API Response: ${response.status} ${url}`, data);
      }

      // Handle API errors
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      return data;
    } else {
      // For non-JSON responses (like file downloads)
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response;
    }
  } catch (error) {
    // Log errors in development
    if (config.isDevelopment) {
      console.error(`❌ API Error: ${url}`, error);
    }

    // Rethrow for handling by the caller
    throw error;
  }
}

/**
 * Shorthand for GET requests
 */
export function get(endpoint, options = {}, timeoutType = "medium") {
  return apiRequest(endpoint, { ...options, method: "GET" }, timeoutType);
}

/**
 * Shorthand for POST requests
 */
export function post(endpoint, data, options = {}, timeoutType = "medium") {
  return apiRequest(
    endpoint,
    {
      ...options,
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    },
    timeoutType
  );
}

/**
 * Shorthand for PUT requests
 */
export function put(endpoint, data, options = {}, timeoutType = "medium") {
  return apiRequest(
    endpoint,
    {
      ...options,
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    },
    timeoutType
  );
}

/**
 * Shorthand for DELETE requests
 */
export function del(endpoint, options = {}, timeoutType = "short") {
  return apiRequest(endpoint, { ...options, method: "DELETE" }, timeoutType);
}

/**
 * Utility for direct Cloudinary uploads
 * This is especially important for Vercel hobby plan which has a 4MB limit
 */
export async function uploadToCloudinary(file, folder, publicId) {
  try {
    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    const isImage = file.type.startsWith("image/");

    // Apply size limits based on file type and folder
    let sizeLimit;
    if (folder === "stories") {
      sizeLimit =
        config.mediaLimits.story[isImage ? "image" : "video"] / (1024 * 1024);
    } else {
      sizeLimit =
        config.mediaLimits.post[isImage ? "image" : "video"] / (1024 * 1024);
    }

    if (fileSizeInMB > sizeLimit) {
      throw new Error(`File size exceeds ${sizeLimit}MB limit`);
    }
    // Get upload signature from backend
    const signatureEndpoint = `api/${
      folder === "stories" ? "stories" : "posts"
    }/upload-signature`;
    const signatureData = await post(
      signatureEndpoint,
      { publicId },
      {},
      "short"
    );

    if (!signatureData.success) {
      throw new Error(
        signatureData.message || "Failed to get upload signature"
      );
    }

    // Create form data for Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signatureData.data.apiKey);
    formData.append("timestamp", signatureData.data.timestamp);
    formData.append("signature", signatureData.data.signature);
    formData.append("public_id", publicId);
    formData.append("folder", `social-media-app/${folder}`);

    // For Vercel hobby plan, we need to use direct upload to Cloudinary
    // as Vercel has a 4MB limit on API routes
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.data.cloudName}/auto/upload`;

    // Use XMLHttpRequest to track upload progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", cloudinaryUrl);

      // Set timeout
      xhr.timeout = config.apiTimeouts.upload;

      // Handle progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          // You can use this to update a progress bar if needed
          if (config.isDevelopment) {
            console.log(`Upload progress: ${percentComplete}%`);
          }
        }
      };

      // Handle completion
      xhr.onload = function () {
        if (xhr.status === 200) {
          const cloudinaryData = JSON.parse(xhr.responseText);
          resolve(cloudinaryData);
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error?.message || "Upload failed"));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      // Handle errors
      xhr.onerror = function () {
        reject(new Error("Network error during upload"));
      };

      xhr.ontimeout = function () {
        reject(new Error("Upload timed out"));
      };

      // Send the request
      xhr.send(formData);
    });
  } catch (error) {
    if (config.isDevelopment) {
      console.error("❌ Cloudinary Upload Error:", error);
    }
    throw error;
  }
}
