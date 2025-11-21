/**
 * Payment Controller
 * Handles payment requests/responses
 */
import { sendSuccess, sendError, ERROR_CODES } from "../utils/responseHandler.js";
import {
  createPaymentRequest,
  getPaymentById,
  getAllPayments,
  approvePayment,
  rejectPayment,
  getUserPayments,
} from "../services/paymentService.js";

/**
 * Create payment request (pending, waiting for admin approval)
 * Requires proof image URL (uploaded to Cloudinary by frontend)
 */
export const processPayment = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED);
    }

    const {
      ho_ten,
      email,
      so_dien_thoai,
      phuong_thuc_thanh_toan,
      ten_goi,
      so_tien,
      hinh_anh_chung_minh, // URL from Cloudinary
    } = req.body;

    if (!ho_ten || !email || !ten_goi || !so_tien) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Thiếu thông tin bắt buộc");
    }

    // For bank transfer, require proof image URL
    if (phuong_thuc_thanh_toan === "bank_transfer" && !hinh_anh_chung_minh) {
      return sendError(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        "Vui lòng cung cấp hình ảnh chứng minh thanh toán"
      );
    }

    // Validate URL format if provided
    if (hinh_anh_chung_minh && !hinh_anh_chung_minh.startsWith("http")) {
      return sendError(
        res,
        ERROR_CODES.VALIDATION_ERROR,
        "URL hình ảnh không hợp lệ"
      );
    }

    const { payment, newRole } = await createPaymentRequest(userId, {
        ho_ten,
        email,
      so_dien_thoai,
      phuong_thuc_thanh_toan: phuong_thuc_thanh_toan || "bank_transfer",
        ten_goi,
        so_tien,
      hinh_anh_chung_minh: hinh_anh_chung_minh || null,
    });

    return sendSuccess(
      res,
      {
        payment_id: payment.id,
        status: payment.trang_thai,
        new_role: newRole,
        proof_image_url: hinh_anh_chung_minh,
      },
      phuong_thuc_thanh_toan === "momo" 
        ? "Đang chuyển hướng đến MoMo..." 
        : "Yêu cầu thanh toán đã được tạo, đang chờ admin duyệt",
      201
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    if (
      error.message.includes("Thiếu thông tin") ||
      error.message.includes("không hợp lệ") ||
      error.message.includes("không khớp") ||
      error.message.includes("không thể hạ cấp") ||
      error.message.includes("hình ảnh chứng minh") ||
      error.message.includes("chỉ chấp nhận")
    ) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, error.message);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi tạo yêu cầu thanh toán");
  }
};

/**
 * Get payment by ID
 */
export const getPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Thiếu ID thanh toán");
    }

    // Validate id is a number
    const paymentId = parseInt(id, 10);
    if (isNaN(paymentId)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "ID thanh toán không hợp lệ");
    }

    const payment = await getPaymentById(paymentId);

    if (!payment) {
      return sendError(res, ERROR_CODES.PAYMENT_NOT_FOUND);
    }

    // Check if user can view this payment
    const userRole = req.user?.role;
    if (userRole !== "admin" && payment.user_id !== userId) {
      return sendError(res, ERROR_CODES.FORBIDDEN, "Bạn không có quyền xem giao dịch này");
    }

    return sendSuccess(res, payment);
  } catch (error) {
    console.error("Error getting payment:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi lấy thông tin thanh toán");
  }
};

/**
 * Get all payments (admin only) or user payments
 */
export const getPayments = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED);
    }

    let payments;

    if (userRole === "admin") {
      // Admin can see all payments with filters
      const { trang_thai, ten_goi, limit, offset } = req.query;
      payments = await getAllPayments(
        {
          trang_thai,
          ten_goi,
        },
        {
          limit: limit ? parseInt(limit) : null,
          offset: offset ? parseInt(offset) : null,
        }
      );
    } else {
      // User can only see their own payments
      payments = await getUserPayments(userId);
    }

    return sendSuccess(res, payments);
  } catch (error) {
    console.error("Error getting payments:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi lấy danh sách thanh toán");
  }
};

/**
 * Approve payment (admin only)
 */
export const approvePaymentRequest = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const userRole = req.user?.role;
    const { id: paymentId } = req.params;

    if (userRole !== "admin") {
      return sendError(res, ERROR_CODES.FORBIDDEN, "Chỉ admin mới có quyền duyệt thanh toán");
    }

    if (!paymentId) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Thiếu ID thanh toán");
    }

    // Validate paymentId is a number
    const paymentIdNum = parseInt(paymentId, 10);
    if (isNaN(paymentIdNum)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "ID thanh toán không hợp lệ");
    }

    const { payment, newRole } = await approvePayment(paymentIdNum, adminId);

    return sendSuccess(
      res,
      {
        payment,
        new_role: newRole,
      },
      "Duyệt thanh toán thành công"
    );
  } catch (error) {
    console.error("Error approving payment:", error);
    if (
      error.message.includes("Không tìm thấy") ||
      error.message.includes("không hợp lệ") ||
      error.message.includes("không thể hạ cấp")
    ) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, error.message);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi duyệt thanh toán");
  }
};

/**
 * Reject payment (admin only)
 */
export const rejectPaymentRequest = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const { id: paymentId } = req.params;

    if (userRole !== "admin") {
      return sendError(res, ERROR_CODES.FORBIDDEN, "Chỉ admin mới có quyền từ chối thanh toán");
    }

    if (!paymentId) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Thiếu ID thanh toán");
    }

    // Validate paymentId is a number
    const paymentIdNum = parseInt(paymentId, 10);
    if (isNaN(paymentIdNum)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "ID thanh toán không hợp lệ");
    }

    const payment = await rejectPayment(paymentIdNum);

    return sendSuccess(res, payment, "Từ chối thanh toán thành công");
  } catch (error) {
    console.error("Error rejecting payment:", error);
    if (error.message.includes("Không tìm thấy") || error.message.includes("Chỉ có thể")) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, error.message);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi từ chối thanh toán");
  }
};

// Keep confirmPayment for backward compatibility (if needed)
export const confirmPayment = async (req, res) => {
  return sendError(
    res,
    ERROR_CODES.VALIDATION_ERROR,
    "Hệ thống đã chuyển sang admin duyệt, vui lòng chờ admin xử lý"
  );
};

