/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Payment management endpoints
 */
import express from "express";
import {
  processPayment,
  getPayment,
  getPayments,
  approvePaymentRequest,
  rejectPaymentRequest,
  confirmPayment,
} from "../controllers/paymentController.js";
import authenticateToken from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/payment:
 *   post:
 *     summary: Create payment request
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ho_ten
 *               - email
 *               - ten_goi
 *               - so_tien
 *             properties:
 *               ho_ten:
 *                 type: string
 *               email:
 *                 type: string
 *               so_dien_thoai:
 *                 type: string
 *               phuong_thuc_thanh_toan:
 *                 type: string
 *                 enum: [momo, bank_transfer]
 *               ten_goi:
 *                 type: string
 *                 enum: [Gói Cơ Bản, Gói Nâng Cao, Gói Năm]
 *               so_tien:
 *                 type: number
 *               hinh_anh_chung_minh:
 *                 type: string
 *                 description: URL của hình ảnh chứng minh (bắt buộc nếu phuong_thuc_thanh_toan = bank_transfer)
 *     responses:
 *       201:
 *         description: Payment request created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/", authenticateToken, processPayment);

/**
 * @swagger
 * /api/payment:
 *   get:
 *     summary: Get all payments (filtered by user or admin)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: trang_thai
 *         schema:
 *           type: string
 *           enum: [pending, completed, rejected]
 *       - in: query
 *         name: ten_goi
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/", authenticateToken, getPayments);

/**
 * @swagger
 * /api/payment/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payment]
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
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/:id", authenticateToken, getPayment);

/**
 * @swagger
 * /api/payment/{id}/approve:
 *   put:
 *     summary: Approve payment (admin only)
 *     tags: [Payment]
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
 *         description: Payment approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put("/:id/approve", authenticateToken, approvePaymentRequest);

/**
 * @swagger
 * /api/payment/{id}/reject:
 *   put:
 *     summary: Reject payment (admin only)
 *     tags: [Payment]
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
 *         description: Payment rejected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put("/:id/reject", authenticateToken, rejectPaymentRequest);

/**
 * @swagger
 * /api/payment/confirm:
 *   post:
 *     summary: Confirm payment (backward compatibility)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment confirmed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/confirm", authenticateToken, confirmPayment);

export default router;
