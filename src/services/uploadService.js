/**
 * Upload Service
 * Handles file upload logic with Cloudinary
 */
import cloudinary, { DEFAULT_UPLOAD_FOLDER } from "../config/cloudinaryConfig.js";

/**
 * Generate upload signature for client-side upload
 * @param {string} folder - Folder path in Cloudinary (defaults to env CLOUDINARY_UPLOAD_FOLDER)
 * @param {string} resourceType - Resource type (image, video, raw, auto)
 * @param {number} timestamp - Timestamp for signature
 * @returns {Object} - Upload signature and parameters
 */
export const generateUploadSignature = async (folder = null, resourceType = "auto", timestamp = null) => {
  try {
    const uploadFolder = folder || DEFAULT_UPLOAD_FOLDER;
    const currentTimestamp = timestamp || Math.round(new Date().getTime() / 1000);
    
    const params = {
      folder: uploadFolder,
      resource_type: resourceType,
      timestamp: currentTimestamp,
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp: currentTimestamp,
      folder: uploadFolder,
      resource_type: resourceType,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    };
  } catch (error) {
    throw new Error(`Error generating upload signature: ${error.message}`);
  }
};

/**
 * Upload file directly to Cloudinary (server-side upload)
 * @param {Buffer|string} file - File buffer or file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
export const uploadFile = async (file, options = {}) => {
  try {
    const {
      folder = null,
      resourceType = "auto",
      publicId = null,
      transformation = null,
    } = options;

    const uploadFolder = folder || DEFAULT_UPLOAD_FOLDER;

    const uploadOptions = {
      folder: uploadFolder,
      resource_type: resourceType,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    if (transformation) {
      uploadOptions.transformation = transformation;
    }

    const result = await cloudinary.uploader.upload(file, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (error) {
    throw new Error(`Error uploading file: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resourceType - Resource type (image, video, raw)
 * @returns {Promise<Object>} - Delete result
 */
export const deleteFile = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return result;
  } catch (error) {
    throw new Error(`Error deleting file: ${error.message}`);
  }
};

/**
 * Get file URL from public ID
 * @param {string} publicId - Public ID of the file
 * @param {Object} options - URL options (transformation, format, etc.)
 * @returns {string} - File URL
 */
export const getFileUrl = (publicId, options = {}) => {
  try {
    const {
      transformation = null,
      format = null,
      resourceType = "auto",
    } = options;

    const urlOptions = {};

    if (transformation) {
      urlOptions.transformation = transformation;
    }

    if (format) {
      urlOptions.format = format;
    }

    return cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      ...urlOptions,
    });
  } catch (error) {
    throw new Error(`Error generating file URL: ${error.message}`);
  }
};

