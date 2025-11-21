/**
 * @swagger
 * tags:
 *   name: User
 *   description: User dashboard endpoints
 */
import express from "express";
import {
  getUserDashboard,
  getAdminDashboard,
} from "../controllers/userController.js";

const router = express.Router();

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get user dashboard
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/", getUserDashboard);

/**
 * @swagger
 * /api/user/admindashboard:
 *   get:
 *     summary: Get admin dashboard
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/admindashboard", getAdminDashboard);

export default router;
