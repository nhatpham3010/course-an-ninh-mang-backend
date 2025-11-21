/**
 * @swagger
 * tags:
 *   name: Labs
 *   description: Lab management endpoints
 */
import express from "express";
import {
  getLabsData,
  getLabById,
  createLab,
} from "../controllers/labController.js";
import authenticateToken from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/labs:
 *   get:
 *     summary: Get all labs
 *     tags: [Labs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of labs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/", authenticateToken, getLabsData);

/**
 * @swagger
 * /api/labs/{id}:
 *   get:
 *     summary: Get lab by ID
 *     tags: [Labs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lab details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/:id", authenticateToken, getLabById);

/**
 * @swagger
 * /api/labs:
 *   post:
 *     summary: Create a new lab (admin)
 *     tags: [Labs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ten
 *               - loai
 *             properties:
 *               ten:
 *                 type: string
 *               loai:
 *                 type: string
 *               mota:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lab created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/", authenticateToken, createLab);

export default router;

