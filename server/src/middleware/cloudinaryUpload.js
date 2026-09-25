import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const thumbnailStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "learnit/thumbnails",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 640, height: 360, crop: "limit" }],
  },
});

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "learnit/videos",
    resource_type: "video",
    type: "authenticated",
    eager_async: true,
    eager: [
      { streaming_profile: "hd", format: "m3u8" },
    ],
  },
});

export const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("thumbnail");

export const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
}).single("video");

export const uploadChapterFiles = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      if (file.fieldname === "thumbnail") {
        return {
          folder: "learnit/thumbnails",
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
          transformation: [{ width: 640, height: 360, crop: "limit" }],
        };
      }
      if (file.fieldname === "video") {
        return {
          folder: "learnit/videos",
          resource_type: "video",
          type: "authenticated",
          eager_async: true,
          eager: [
            { streaming_profile: "hd", format: "m3u8" },
          ],
        };
      }
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
}).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);

export const generateSignedUrl = (publicId, resourceType = "video") => {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
  });
};
