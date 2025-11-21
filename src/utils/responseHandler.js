/**
 * Response Handler Utility
 * Standardizes API responses with error_code, message, and data
 */

// Error codes - Tổ chức theo module, mỗi module có range riêng
export const ERROR_CODES = {
  SUCCESS: 0,

  // General errors (30000-30999)
  WRONG_QUERY: 30002,
  WRONG_BODY: 30003,
  INVALID_SESSION_USER: 30004,
  LOCALE_NOT_FOUND: 30005,

  // Auth errors (40000-40099)
  INVALID_CREDENTIALS: 40001,
  EMAIL_NOT_FOUND: 40002,
  WRONG_PASSWORD: 40003,
  EMAIL_ALREADY_EXISTS: 40004,
  INVALID_RESET_CODE: 40005,
  RESET_CODE_EXPIRED: 40006,
  RESET_CODE_MISSING: 40007,
  INVALID_TOKEN: 40008,
  TOKEN_EXPIRED: 40009,
  UNAUTHORIZED: 40010,

  // User errors (40100-40199)
  USER_NOT_FOUND: 40101,
  USER_ALREADY_EXISTS: 40102,
  INVALID_USER_DATA: 40103,
  USER_UPDATE_FAILED: 40104,
  USER_DELETE_FAILED: 40105,

  // Course errors (40200-40299)
  COURSE_NOT_FOUND: 40201,
  COURSE_ALREADY_EXISTS: 40202,
  INVALID_COURSE_DATA: 40203,
  COURSE_CREATE_FAILED: 40204,
  COURSE_UPDATE_FAILED: 40205,
  COURSE_DELETE_FAILED: 40206,
  COURSE_NOT_ENROLLED: 40207,
  LESSON_NOT_FOUND: 40208,
  LESSON_CONTENT_NOT_FOUND: 40209,

  // Lab errors (40300-40399)
  LAB_NOT_FOUND: 40301,
  LAB_ALREADY_EXISTS: 40302,
  INVALID_LAB_DATA: 40303,
  LAB_CREATE_FAILED: 40304,
  LAB_UPDATE_FAILED: 40305,
  LAB_DELETE_FAILED: 40306,
  LAB_REQUIRED_FIELDS_MISSING: 40307,

  // CTF errors (40400-40499)
  CTF_NOT_FOUND: 40401,
  CTF_ALREADY_EXISTS: 40402,
  INVALID_CTF_DATA: 40403,
  CTF_CREATE_FAILED: 40404,
  CTF_UPDATE_FAILED: 40405,
  CTF_DELETE_FAILED: 40406,
  CTF_REQUIRED_FIELDS_MISSING: 40407,

  // Payment errors (40500-40599)
  PAYMENT_NOT_FOUND: 40501,
  PAYMENT_FAILED: 40502,
  INVALID_PAYMENT_DATA: 40503,
  PAYMENT_ALREADY_PROCESSED: 40504,
  PAYMENT_NOT_PENDING: 40505,

  // Validation errors (40600-40699)
  VALIDATION_ERROR: 40601,
  MISSING_REQUIRED_FIELD: 40602,
  INVALID_FORMAT: 40603,
  INVALID_INPUT: 40604,

  // Server errors (50000-50999)
  SERVER_ERROR: 50001,
  DATABASE_ERROR: 50002,
  INTERNAL_ERROR: 50003,
  SERVICE_UNAVAILABLE: 50004,
};

// Error map: error_code -> { message, statusCode }
export const ERROR_MAP = {
  // General
  [ERROR_CODES.WRONG_QUERY]: { message: "Wrong query", statusCode: 400 },
  [ERROR_CODES.WRONG_BODY]: { message: "Wrong body", statusCode: 400 },
  [ERROR_CODES.INVALID_SESSION_USER]: { message: "Invalid session user", statusCode: 400 },
  [ERROR_CODES.LOCALE_NOT_FOUND]: { message: "Locale not found", statusCode: 404 },

  // Auth
  [ERROR_CODES.INVALID_CREDENTIALS]: { message: "Invalid credentials", statusCode: 400 },
  [ERROR_CODES.EMAIL_NOT_FOUND]: { message: "Email không tồn tại", statusCode: 400 },
  [ERROR_CODES.WRONG_PASSWORD]: { message: "Sai mật khẩu", statusCode: 400 },
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: { message: "Email already exists", statusCode: 409 },
  [ERROR_CODES.INVALID_RESET_CODE]: { message: "Mã xác nhận không hợp lệ hoặc đã sử dụng", statusCode: 400 },
  [ERROR_CODES.RESET_CODE_EXPIRED]: { message: "Mã xác nhận đã hết hạn", statusCode: 400 },
  [ERROR_CODES.RESET_CODE_MISSING]: { message: "Code missing", statusCode: 400 },
  [ERROR_CODES.INVALID_TOKEN]: { message: "Invalid token", statusCode: 401 },
  [ERROR_CODES.TOKEN_EXPIRED]: { message: "Token expired", statusCode: 401 },
  [ERROR_CODES.UNAUTHORIZED]: { message: "Unauthorized", statusCode: 401 },

  // User
  [ERROR_CODES.USER_NOT_FOUND]: { message: "User not found", statusCode: 404 },
  [ERROR_CODES.USER_ALREADY_EXISTS]: { message: "User already exists", statusCode: 409 },
  [ERROR_CODES.INVALID_USER_DATA]: { message: "Invalid user data", statusCode: 400 },

  // Course
  [ERROR_CODES.COURSE_NOT_FOUND]: { message: "Course not found", statusCode: 404 },
  [ERROR_CODES.COURSE_NOT_ENROLLED]: { message: "Bạn chưa đăng ký khóa học này", statusCode: 403 },
  [ERROR_CODES.LESSON_NOT_FOUND]: { message: "Lesson not found", statusCode: 404 },
  [ERROR_CODES.LESSON_CONTENT_NOT_FOUND]: { message: "Không tìm thấy nội dung bài học", statusCode: 404 },

  // Forbidden
  [ERROR_CODES.FORBIDDEN]: { message: "Forbidden", statusCode: 403 },
  [ERROR_CODES.ACCESS_DENIED]: { message: "Access denied", statusCode: 403 },

  // Lab
  [ERROR_CODES.LAB_NOT_FOUND]: { message: "Lab không tồn tại", statusCode: 404 },
  [ERROR_CODES.LAB_REQUIRED_FIELDS_MISSING]: { message: "Thiếu field required: ten và loai", statusCode: 400 },

  // CTF
  [ERROR_CODES.CTF_NOT_FOUND]: { message: "CTF không tồn tại", statusCode: 404 },
  [ERROR_CODES.CTF_REQUIRED_FIELDS_MISSING]: { message: "Thiếu field required: ten, loaictf, tacgia, choai", statusCode: 400 },

  // Payment
  [ERROR_CODES.PAYMENT_NOT_FOUND]: { message: "Payment not found", statusCode: 404 },
  [ERROR_CODES.PAYMENT_FAILED]: { message: "Payment failed", statusCode: 400 },
  [ERROR_CODES.INVALID_PAYMENT_DATA]: { message: "Invalid payment data", statusCode: 400 },
  [ERROR_CODES.PAYMENT_ALREADY_PROCESSED]: { message: "Payment already processed", statusCode: 400 },
  [ERROR_CODES.PAYMENT_NOT_PENDING]: { message: "Payment is not pending", statusCode: 400 },

  // Validation
  [ERROR_CODES.VALIDATION_ERROR]: { message: "Validation error", statusCode: 400 },
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: { message: "Missing required field", statusCode: 400 },
  [ERROR_CODES.INVALID_FORMAT]: { message: "Invalid format", statusCode: 400 },
  [ERROR_CODES.INVALID_INPUT]: { message: "Invalid input", statusCode: 400 },

  // Server
  [ERROR_CODES.SERVER_ERROR]: { message: "Internal server error", statusCode: 500 },
  [ERROR_CODES.DATABASE_ERROR]: { message: "Database error", statusCode: 500 },
  [ERROR_CODES.INTERNAL_ERROR]: { message: "Internal error", statusCode: 500 },
};

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
export const sendSuccess = (res, data = null, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    error_code: ERROR_CODES.SUCCESS,
    message,
    data,
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} errorCode - Error code from ERROR_CODES
 * @param {string} customMessage - Custom message (optional, will override default)
 * @param {*} data - Additional error data (optional)
 */
export const sendError = (res, errorCode, customMessage = null, data = null) => {
  const errorInfo = ERROR_MAP[errorCode] || {
    message: "Unknown error",
    statusCode: 500,
  };

  const response = {
    error_code: errorCode,
    message: customMessage || errorInfo.message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(errorInfo.statusCode).json(response);
};
