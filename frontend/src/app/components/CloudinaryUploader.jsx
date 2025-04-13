"use client";

import Image from "next/image";
import { Upload, X } from "lucide-react";
import React, { useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import config from "@/lib/config";

const CloudinaryUploader = ({
  onUploadComplete,
  onUploadError,
  maxSize = 10, // Default max size in MB
  acceptedFileTypes = "image/*,video/*",
  uploadType = "post", // 'post' or 'story'
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check file size
    const fileSizeInMB = selectedFile.size / (1024 * 1024);
    const isImage = selectedFile.type.startsWith("image/");
    const isVideo = selectedFile.type.startsWith("video/");

    // Apply different size limits based on file type and upload type
    let sizeLimit = maxSize;
    if (uploadType === "post") {
      // Use limits from config
      const postLimits = config.mediaLimits.post;
      sizeLimit = isImage
        ? postLimits.image / (1024 * 1024)
        : postLimits.video / (1024 * 1024);
    } else if (uploadType === "story") {
      // Use limits from config
      const storyLimits = config.mediaLimits.story;
      sizeLimit = isImage
        ? storyLimits.image / (1024 * 1024)
        : storyLimits.video / (1024 * 1024);
    }

    if (fileSizeInMB > sizeLimit) {
      setError(`File size exceeds ${sizeLimit}MB limit`);
      return;
    }

    // Check file type
    if (!isImage && !isVideo) {
      setError("Only images and videos are allowed");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(10);

      // Determine file type
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      // Validate file type
      if (!isImage && !isVideo) {
        setError("Only images and videos are allowed");
        setUploading(false);
        return;
      }

      // Get upload signature from backend
      const publicId = `${uploadType}_${Date.now()}`;
      const fileResourceType = isImage ? "image" : "video";

      const signatureResponse = await fetch(
        `${config.backendUrl}/api/${
          uploadType === "post" ? "posts" : "stories"
        }/upload-signature`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            publicId,
            resourceType: fileResourceType,
          }),
          timeout: config.apiTimeouts.short,
        }
      );

      setProgress(30);

      const signatureData = await signatureResponse.json();

      if (!signatureData.success) {
        throw new Error(signatureData.message);
      }

      // Upload to Cloudinary directly
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signatureData.data.apiKey);
      formData.append("timestamp", signatureData.data.timestamp);
      formData.append("signature", signatureData.data.signature);
      formData.append("public_id", publicId);
      formData.append(
        "folder",
        `social-media-app/${uploadType === "post" ? "posts" : "stories"}`
      );

      // Use the resource_type from the signature data
      const resourceType =
        signatureData.data.resourceType || (isImage ? "image" : "video");
      formData.append("resource_type", resourceType);

      console.log("Uploading to Cloudinary:", {
        fileType: file.type,
        isImage,
        isVideo,
        resourceType: resourceType,
        publicId,
        url: `https://api.cloudinary.com/v1_1/${signatureData.data.cloudName}/${resourceType}/upload`,
      });

      // Create XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${signatureData.data.cloudName}/${resourceType}/upload`
      );

      // Set timeout (180 seconds for large files)
      xhr.timeout = 180000;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete =
            Math.round((event.loaded / event.total) * 70) + 30;
          setProgress(percentComplete > 100 ? 100 : percentComplete);
        }
      };

      xhr.onload = function () {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log("Cloudinary upload success:", response);
          setProgress(100);

          // Call the callback with the uploaded file data
          onUploadComplete({
            url: response.secure_url,
            publicId: response.public_id,
            type: response.resource_type === "image" ? "image" : "video",
            width: response.width,
            height: response.height,
          });

          // Reset the uploader
          setTimeout(() => {
            setFile(null);
            setPreview(null);
            setUploading(false);
            setProgress(0);
          }, 1000);
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            console.error("Cloudinary upload error:", error);
            setError(error.error?.message || "Upload failed");
          } catch (e) {
            console.error(
              "Error parsing Cloudinary response:",
              xhr.responseText
            );
            setError("Upload failed: " + xhr.status);
          }
          setUploading(false);
          if (onUploadError) {
            onUploadError("Upload failed");
          }
        }
      };

      xhr.onerror = function () {
        console.error("Cloudinary upload failed", xhr.status, xhr.responseText);
        setError("Upload failed. Please try again.");
        setUploading(false);
        if (onUploadError) {
          onUploadError("Upload failed. Please try again.");
        }
      };

      // Add timeout handler
      xhr.ontimeout = function () {
        console.error("Cloudinary upload timed out");
        setError(
          "Upload timed out. Please try again with a smaller file or better connection."
        );
        setUploading(false);
        if (onUploadError) {
          onUploadError("Upload timed out. Please try again.");
        }
      };

      xhr.send(formData);
    } catch (error) {
      setError(error.message);
      setUploading(false);
      if (onUploadError) {
        onUploadError(error.message);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {uploadType === "post"
              ? "Images (JPG, PNG, GIF, WebP up to 10MB) or Videos (up to 100MB)"
              : "Images (JPG, PNG, GIF, WebP) or Videos (up to 5MB)"}
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={acceptedFileTypes}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden">
          {preview && (
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              {file.type.startsWith("image/") ? (
                <div className="relative w-full h-full">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain"
                  />
                </div>
              ) : (
                <video
                  src={preview}
                  controls
                  className="w-full h-full object-contain"
                />
              )}
              {!uploading && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          {uploading ? (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Uploading...
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <Button
              className="w-full mt-4"
              onClick={handleUpload}
              disabled={!file || !!error}
            >
              Upload
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CloudinaryUploader;
