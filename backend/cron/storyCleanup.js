const Story = require("../model/Story");
const { cloudinary } = require("../middleware/upload");
const { extractPublicIdFromUrl } = require("../utils/cloudinaryUtils");

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
