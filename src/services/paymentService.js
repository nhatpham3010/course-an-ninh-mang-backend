/**
 * Payment Service
 * Handles payment business logic
 */
import pool from "../config/db.js";
import { PaymentModel } from "../models/Payment.js";
import { create, getOne, getAll, update } from "../utils/queryHelpers.js";

// Package configuration
export const PACKAGE_CONFIG = {
  "Gói Cơ Bản": { role: "user_basic", price: 39000, course_type: "basic" },
  "Gói Nâng Cao": { role: "user_premium", price: 89000, course_type: "premium" },
  "Gói Năm": { role: "user_year", price: 1299000, course_type: "year" },
};

// Role priority
export const ROLE_PRIORITY = {
  user: 0,
  user_basic: 1,
  user_premium: 2,
  user_year: 3,
};

/**
 * Validate payment data
 */
export const validatePaymentData = (paymentData, user) => {
  const { ho_ten, email, ten_goi, so_tien, hinh_anh_chung_minh } = paymentData;

  // Check required fields
  if (!ho_ten || !email || !ten_goi || !so_tien) {
    throw new Error("Thiếu thông tin bắt buộc");
  }

  // Check proof image is required
  if (!hinh_anh_chung_minh) {
    throw new Error("Vui lòng cung cấp hình ảnh chứng minh thanh toán");
  }

  // Check package exists
  if (!PACKAGE_CONFIG[ten_goi]) {
    throw new Error("Gói không hợp lệ");
  }

  // Check amount matches package
  if (parseFloat(so_tien) !== PACKAGE_CONFIG[ten_goi].price) {
    throw new Error(`Số tiền không khớp với ${ten_goi}`);
  }

  // Check email matches user
  if (user.email !== email) {
    throw new Error("Email không khớp với tài khoản");
  }

  // Check role upgrade
  const currentRole = user.role || "user";
  const newRole = PACKAGE_CONFIG[ten_goi].role;

  if (ROLE_PRIORITY[currentRole] >= ROLE_PRIORITY[newRole]) {
    throw new Error(
      `Bạn đã có vai trò ${currentRole}, không thể hạ cấp hoặc mua gói tương đương`
    );
  }

  return { newRole };
};

/**
 * Create payment request (pending status)
 */
export const createPaymentRequest = async (userId, paymentData) => {
  const userResult = await pool.query("SELECT role, email FROM users WHERE id = $1", [userId]);

  if (userResult.rows.length === 0) {
    throw new Error("Người dùng không tồn tại");
  }

  const user = userResult.rows[0];
  const { newRole } = validatePaymentData(paymentData, user);

  // Create payment with pending status
  const payment = await create(PaymentModel.tableName, {
    user_id: userId,
    ho_ten: paymentData.ho_ten,
    email: paymentData.email,
    so_dien_thoai: paymentData.so_dien_thoai || null,
    phuong_thuc_thanh_toan: paymentData.phuong_thuc_thanh_toan || "bank_transfer",
    ten_goi: paymentData.ten_goi,
    so_tien: paymentData.so_tien,
    trang_thai: "pending",
    hinh_anh_chung_minh: paymentData.hinh_anh_chung_minh,
  });

  return { payment, newRole };
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (id) => {
  return await getOne(PaymentModel.tableName, id);
};

/**
 * Get all payments with filters
 */
export const getAllPayments = async (filters = {}, options = {}) => {
  let query = `
    SELECT 
      t.*,
      u.ten as user_name,
      u.email as user_email
    FROM ${PaymentModel.tableName} t
    LEFT JOIN users u ON u.id = t.user_id
  `;

  const params = [];
  const whereClauses = [];
  let paramIndex = 1;

  // Add filters
  if (filters.user_id) {
    whereClauses.push(`t.user_id = $${paramIndex}`);
    params.push(filters.user_id);
    paramIndex++;
  }

  if (filters.trang_thai) {
    whereClauses.push(`t.trang_thai = $${paramIndex}`);
    params.push(filters.trang_thai);
    paramIndex++;
  }

  if (filters.ten_goi) {
    whereClauses.push(`t.ten_goi = $${paramIndex}`);
    params.push(filters.ten_goi);
    paramIndex++;
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  // Add ordering
  query += ` ORDER BY t.ngay_thanh_toan DESC`;

  // Add limit and offset
  if (options.limit) {
    query += ` LIMIT $${paramIndex}`;
    params.push(options.limit);
    paramIndex++;
  }

  if (options.offset) {
    query += ` OFFSET $${paramIndex}`;
    params.push(options.offset);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Approve payment (admin only)
 */
export const approvePayment = async (paymentId, adminId) => {
  // Start transaction
  await pool.query("BEGIN");

  try {
    // Get payment with user info
    const paymentQuery = `
      SELECT t.*, u.role as current_role
      FROM ${PaymentModel.tableName} t
      JOIN users u ON u.id = t.user_id
      WHERE t.id = $1 AND t.trang_thai = 'pending'
    `;
    const paymentResult = await pool.query(paymentQuery, [paymentId]);

    if (paymentResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      throw new Error("Không tìm thấy giao dịch pending");
    }

    const payment = paymentResult.rows[0];

    // Validate package
    if (!PACKAGE_CONFIG[payment.ten_goi]) {
      await pool.query("ROLLBACK");
      throw new Error("Gói không hợp lệ");
    }

    const newRole = PACKAGE_CONFIG[payment.ten_goi].role;
    const newCourseType = PACKAGE_CONFIG[payment.ten_goi].course_type;
    const currentRole = payment.current_role || "user";

    // Check role priority
    if (ROLE_PRIORITY[currentRole] >= ROLE_PRIORITY[newRole]) {
      await pool.query("ROLLBACK");
      throw new Error("Không thể hạ cấp vai trò");
    }

    // Update payment status
    await update(PaymentModel.tableName, paymentId, {
      trang_thai: "completed",
    });

    // Update user role and course_type
    await pool.query("UPDATE users SET role = $1, course_type = $2 WHERE id = $3", [
      newRole,
      newCourseType,
      payment.user_id,
    ]);

    // Commit transaction
    await pool.query("COMMIT");

    return {
      payment: await getPaymentById(paymentId),
      newRole,
    };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
};

/**
 * Reject payment (admin only)
 */
export const rejectPayment = async (paymentId) => {
  const payment = await getPaymentById(paymentId);

  if (!payment) {
    throw new Error("Không tìm thấy giao dịch");
  }

  if (payment.trang_thai !== "pending") {
    throw new Error("Chỉ có thể từ chối giao dịch đang pending");
  }

  return await update(PaymentModel.tableName, paymentId, {
    trang_thai: "rejected",
  });
};

/**
 * Get user payments
 */
export const getUserPayments = async (userId) => {
  return await getAllPayments({ user_id: userId });
};

