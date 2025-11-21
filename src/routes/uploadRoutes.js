/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload endpoints (Cloudinary)
 */
import express from "express";
import {
  getPresignedUrl,
  uploadFileDirect,
  deleteUploadedFile,
  getFileUrlByPublicId,
  upload,
} from "../controllers/uploadController.js";

const router = express.Router();

/**
 * @swagger
 * /api/upload/presign:
 *   get:
 *     summary: Get presigned URL for client-side upload
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *           enum: [image, video, raw, auto]
 *     responses:
 *       200:
 *         description: Presigned URL generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/presign", getPresignedUrl);

/**
 * @swagger
 * /api/upload/upload:
 *   post:
 *     summary: Upload file directly (server-side)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/upload", upload.single("file"), uploadFileDirect);

/**
 * @swagger
 * /api/upload/delete:
 *   delete:
 *     summary: Delete uploaded file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete("/delete", deleteUploadedFile);

/**
 * @swagger
 * /api/upload/url:
 *   get:
 *     summary: Get file URL by public ID
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/url", getFileUrlByPublicId);

export default router;
