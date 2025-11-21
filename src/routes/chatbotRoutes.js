/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: AI Chatbot endpoints
 */
import express from "express";
import {
  sendChat,
  getUserTopics,
  getTopicQA,
} from "../controllers/chatbotController.js";

const router = express.Router();

/**
 * @swagger
 * /api/chatbot/chat:
 *   post:
 *     summary: Send chat message to AI
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               topicId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/chat", sendChat);

/**
 * @swagger
 * /api/chatbot/topics:
 *   get:
 *     summary: Get user's chat topics
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of topics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/topics", getUserTopics);

/**
 * @swagger
 * /api/chatbot/topics/{topicId}/qa:
 *   get:
 *     summary: Get Q&A for a topic
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Topic Q&A
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/topics/:topicId/qa", getTopicQA);

export default router;
