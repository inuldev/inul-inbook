/**
 * Utility functions for Cloudinary operations
 */

/**
 * Extract public ID and resource type from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {Object} - Object with publicId and resourceType
 */
const extractPublicIdFromUrl = (url) => {
  try {
    if (!url) return { publicId: null, resourceType: null };

    // Example URL: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/social-media-app/posts/post_1234567890.jpg
    // or https://res.cloudinary.com/cloud-name/video/upload/v1234567890/social-media-app/posts/post_1234567890.mp4

    // Determine resource type (image or video)
    let resourceType = "image";
    if (url.includes("/video/upload/")) {
      resourceType = "video";
    } else if (url.includes("/image/upload/")) {
      resourceType = "image";
    } else if (
      url.toLowerCase().endsWith(".mp4") ||
      url.toLowerCase().endsWith(".mov")
    ) {
      resourceType = "video";
    }

    // Extract the path after /upload/
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return { publicId: null, resourceType: null };

    const pathAfterUpload = url.substring(uploadIndex + 8);

    // Remove version number if present (v1234567890/)
    const versionRemoved = pathAfterUpload.replace(/^v\d+\//, "");

    // Remove file extension
    const publicId = versionRemoved.replace(/\.[^/.]+$/, "");

    return { publicId, resourceType };
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return { publicId: null, resourceType: null };
  }
};

module.exports = {
  extractPublicIdFromUrl,
};
