const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const config = require("../config/config");

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Log Cloudinary configuration status in development mode
if (config.isDevelopment) {
  console.log(
    `📷 Cloudinary configured with cloud name: ${config.cloudinary.cloudName}`
  );
}

// Configure storage for stories (smaller files)
const storyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "social-media-app/stories",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"],
    resource_type: "auto",
  },
});

// Configure storage for profile pictures and cover photos
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "social-media-app/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    resource_type: "image",
  },
});

// Configure storage for post media
const postStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "social-media-app/posts",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"],
    resource_type: "auto",
  },
});

// Configure upload for stories (limited to 5MB)
const storyUpload = multer({
  storage: storyStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for stories
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image or video
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed for stories"), false);
    }
  },
});

// Configure upload for profile pictures and cover photos (limited to 5MB)
const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile pictures
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed for profile pictures"), false);
    }
  },
});

// Configure upload for post media (10MB for images, 100MB for videos)
const postUpload = multer({
  storage: postStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max limit (for videos)
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image or video
    if (file.mimetype.startsWith("image/")) {
      // For images, limit to 10MB
      if (parseInt(req.headers["content-length"]) > 10 * 1024 * 1024) {
        cb(new Error("Images must be less than 10MB"), false);
      } else {
        cb(null, true);
      }
    } else if (file.mimetype.startsWith("video/")) {
      // For videos, limit to 100MB
      if (parseInt(req.headers["content-length"]) > 100 * 1024 * 1024) {
        cb(new Error("Videos must be less than 100MB"), false);
      } else {
        cb(null, true);
      }
    } else {
      cb(new Error("Only images and videos are allowed"), false);
    }
  },
});

// Helper function to generate Cloudinary signature for direct uploads
const generateSignature = (publicId, folder, resourceType = "auto") => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  // Create params object for signature
  const params = {
    timestamp: timestamp,
    public_id: publicId,
    folder: `social-media-app/${folder}`,
  };

  // Generate signature
  const signature = cloudinary.utils.api_sign_request(
    params,
    config.cloudinary.apiSecret
  );

  // Log signature details in development
  if (config.isDevelopment) {
    console.log("Generating Cloudinary signature:", {
      publicId,
      folder: `social-media-app/${folder}`,
      resourceType,
      timestamp,
    });
  }

  return {
    timestamp,
    signature,
    apiKey: config.cloudinary.apiKey,
    cloudName: config.cloudinary.cloudName,
    resourceType,
  };
};

// Helper function to validate file size based on type and environment
const validateFileSize = (file, maxSize) => {
  // In development, we might want to be more lenient with file sizes for testing
  const sizeMultiplier = config.isDevelopment ? 1.2 : 1;
  const adjustedMaxSize = maxSize * sizeMultiplier;

  return file.size <= adjustedMaxSize;
};

module.exports = {
  storyUpload,
  profileUpload,
  postUpload,
  generateSignature,
  validateFileSize,
  cloudinary,
};
