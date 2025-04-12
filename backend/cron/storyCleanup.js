const Story = require("../model/Story");
const { cloudinary } = require("../middleware/upload");

// Helper function to extract public ID and resource type from Cloudinary URL
const extractPublicIdFromUrl = (url) => {
  try {
    if (!url) return { publicId: null, resourceType: null };

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

/**
 * Cleanup expired stories and their media from Cloudinary
 * This function should be called periodically (e.g., every hour)
 */
const cleanupExpiredStories = async () => {
  try {
    console.log("Starting expired stories cleanup...");

    // Find expired stories
    const expiredStories = await Story.find({
      expiresAt: { $lt: new Date() },
    });

    console.log(`Found ${expiredStories.length} expired stories to clean up`);

    // Delete media from Cloudinary for each expired story
    for (const story of expiredStories) {
      if (story.mediaUrl) {
        try {
          const { publicId, resourceType } = extractPublicIdFromUrl(
            story.mediaUrl
          );
          if (publicId) {
            await cloudinary.uploader.destroy(publicId, {
              resource_type: resourceType,
            });
            console.log(
              `Deleted expired story media from Cloudinary: ${publicId} (${resourceType})`
            );
          }
        } catch (cloudinaryError) {
          console.error(
            "Error deleting story media from Cloudinary:",
            cloudinaryError
          );
          // Continue with next story even if Cloudinary deletion fails
        }
      }

      // Delete the story from database
      await story.deleteOne();
    }

    console.log(
      `Cleanup completed. Deleted ${expiredStories.length} expired stories.`
    );
  } catch (error) {
    console.error("Error during expired stories cleanup:", error);
  }
};

module.exports = {
  cleanupExpiredStories,
};
