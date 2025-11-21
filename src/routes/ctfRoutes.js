/**
 * @swagger
 * tags:
 *   name: CTF
 *   description: CTF management endpoints
 */
import express from "express";
import {
  getCTFData,
  getCtfById,
  createCtf,
  updateCtf,
  deleteCtf,
  submitCtfAnswer,
} from "../controllers/ctfController.js";
import authenticateToken from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/ctf:
 *   get:
 *     summary: Get all CTFs
 *     tags: [CTF]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of CTFs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/", authenticateToken, getCTFData);

/**
 * @swagger
 * /api/ctf/{id}:
 *   get:
 *     summary: Get CTF by ID
 *     tags: [CTF]
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
 *         description: CTF details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/:id", authenticateToken, getCtfById);

/**
 * @swagger
 * /api/ctf:
 *   post:
 *     summary: Create a new CTF (admin)
 *     tags: [CTF]
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
 *               - loaictf
 *               - tacgia
 *               - choai
 *             properties:
 *               ten:
 *                 type: string
 *               loaictf:
 *                 type: string
 *               tacgia:
 *                 type: string
 *               choai:
 *                 type: string
 *               mota:
 *                 type: string
 *     responses:
 *       201:
 *         description: CTF created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/", authenticateToken, createCtf);

/**
 * @swagger
 * /api/ctf/{id}:
 *   put:
 *     summary: Update CTF (admin)
 *     tags: [CTF]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ten:
 *                 type: string
 *               loaictf:
 *                 type: string
 *               tacgia:
 *                 type: string
 *               choai:
 *                 type: string
 *               mota:
 *                 type: string
 *               pdf_url:
 *                 type: string
 *               points:
 *                 type: integer
 *               duration:
 *                 type: string
 *     responses:
 *       200:
 *         description: CTF updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put("/:id", authenticateToken, updateCtf);

/**
 * @swagger
 * /api/ctf/{id}:
 *   delete:
 *     summary: Delete CTF (admin)
 *     tags: [CTF]
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
 *         description: CTF deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete("/:id", authenticateToken, deleteCtf);

/**
 * @swagger
 * /api/ctf/{id}/submit:
 *   post:
 *     summary: Submit CTF answer
 *     tags: [CTF]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answerText:
 *                 type: string
 *               answerFileUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/:id/submit", authenticateToken, submitCtfAnswer);

export default router;

