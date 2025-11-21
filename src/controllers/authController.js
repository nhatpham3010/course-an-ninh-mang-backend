/**
 * Auth Controller
 * Handles authentication requests/responses
 */
import {
  register as registerService,
  login as loginService,
  forgotPassword as forgotPasswordService,
  verifyResetCode as verifyResetCodeService,
  updatePassword as updatePasswordService,
} from "../services/authService.js";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/responseHandler.js";
import { presentUser } from "../presenters/userPresenter.js";

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { ten, email, matkhau, ngaysinh } = req.body;

    if (!ten || !email || !matkhau) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Vui lòng cung cấp đầy đủ thông tin");
    }

    const user = await registerService({ ten, email, matkhau, ngaysinh });

    return sendSuccess(
      res,
      { user: presentUser(user) },
      "Đăng ký thành công",
      201
    );
  } catch (error) {
    console.error("Error in register:", error);
    if (error.message.includes("Email đã tồn tại")) {
      return sendError(res, ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi đăng ký");
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, matkhau } = req.body;

    if (!email || !matkhau) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Vui lòng cung cấp email và mật khẩu");
    }

    const { token, user } = await loginService(email, matkhau);

    return sendSuccess(res, {
      token,
      user: presentUser(user),
    }, "Đăng nhập thành công");
  } catch (error) {
    console.error("Error in login:", error);
    if (error.message.includes("Email không tồn tại")) {
      return sendError(res, ERROR_CODES.EMAIL_NOT_FOUND);
    }
    if (error.message.includes("Sai mật khẩu")) {
      return sendError(res, ERROR_CODES.WRONG_PASSWORD);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi đăng nhập");
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email, ten } = req.body;

    if (!email || !ten) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Vui lòng cung cấp email và họ tên");
    }

    const result = await forgotPasswordService(email, ten);

    return sendSuccess(res, null, result.message);
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    if (error.message.includes("Email hoặc họ tên không đúng")) {
      return sendError(res, ERROR_CODES.INVALID_CREDENTIALS);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi gửi mã xác nhận");
  }
};

/**
 * Verify reset code
 */
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Vui lòng cung cấp email và mã xác nhận");
    }

    const result = await verifyResetCodeService(email, code);

    return sendSuccess(res, { userId: result.userId }, "Mã xác nhận hợp lệ");
  } catch (error) {
    console.error("Error in verifyResetCode:", error);
    if (error.message.includes("Mã xác nhận không hợp lệ")) {
      return sendError(res, ERROR_CODES.INVALID_RESET_CODE);
    }
    if (error.message.includes("Mã xác nhận đã hết hạn")) {
      return sendError(res, ERROR_CODES.RESET_CODE_EXPIRED);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi kiểm tra mã xác nhận");
  }
};

/**
 * Update password
 */
export const updatePassword = async (req, res) => {
  try {
    const { userId, code, newPassword } = req.body;

    if (!userId || !code || !newPassword) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Vui lòng cung cấp userId, mã xác nhận và mật khẩu mới");
    }

    const result = await updatePasswordService(userId, code, newPassword);

    return sendSuccess(res, null, result.message);
  } catch (error) {
    console.error("Error in updatePassword:", error);
    if (error.message.includes("Mã xác nhận không hợp lệ")) {
      return sendError(res, ERROR_CODES.INVALID_RESET_CODE);
    }
    if (error.message.includes("Mã xác nhận đã hết hạn")) {
      return sendError(res, ERROR_CODES.RESET_CODE_EXPIRED);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi đặt lại mật khẩu");
  }
};
