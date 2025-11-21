/**
 * Upload Controller
 * Handles file upload requests/responses
 */
import { sendSuccess, sendError, ERROR_CODES } from "../utils/responseHandler.js";
import {
  generateUploadSignature,
  uploadFile,
  deleteFile,
  getFileUrl,
} from "../services/uploadService.js";
import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Get presigned upload URL (Cloudinary signature)
 * For client-side direct upload to Cloudinary
 * folder: optional, defaults to CLOUDINARY_UPLOAD_FOLDER from env
 */
export const getPresignedUrl = async (req, res) => {
  try {
    const { folder = null, resourceType = "auto" } = req.query;

    const signatureData = await generateUploadSignature(folder, resourceType);

    return sendSuccess(res, signatureData);
  } catch (error) {
    console.error("Error generating upload signature:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Failed to generate upload signature");
  }
};

/**
 * Upload file directly (server-side upload)
 * folder: optional, defaults to CLOUDINARY_UPLOAD_FOLDER from env
 */
export const uploadFileDirect = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "No file provided");
    }

    const { folder = null, resourceType = "auto", publicId = null } = req.body;

    // Convert buffer to data URI for Cloudinary
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const result = await uploadFile(dataUri, {
      folder,
      resourceType,
      publicId,
    });

    return sendSuccess(res, result, "File uploaded successfully", 201);
  } catch (error) {
    console.error("Error uploading file:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Failed to upload file");
  }
};

/**
 * Delete file from Cloudinary
 */
export const deleteUploadedFile = async (req, res) => {
  try {
    const { publicId, resourceType = "image" } = req.body;

    if (!publicId) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Missing publicId parameter");
    }

    const result = await deleteFile(publicId, resourceType);

    return sendSuccess(res, result, "File deleted successfully");
  } catch (error) {
    console.error("Error deleting file:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Failed to delete file");
  }
};

/**
 * Get file URL from public ID
 */
export const getFileUrlByPublicId = async (req, res) => {
  try {
    const { publicId, transformation, format, resourceType = "auto" } = req.query;

    if (!publicId) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Missing publicId parameter");
    }

    const url = getFileUrl(publicId, {
      transformation,
      format,
      resourceType,
    });

    return sendSuccess(res, { url });
  } catch (error) {
    console.error("Error getting file URL:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Failed to get file URL");
  }
};

// Export multer middleware for use in routes
export { upload };
