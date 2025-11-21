/**
 * CTF Controller
 * Handles request/response for CTF endpoints
 */
import {
  getCTFData as getCTFDataService,
  getCtfById as getCtfByIdService,
  createCtf as createCtfService,
  updateCtf as updateCtfService,
  deleteCtf as deleteCtfService,
  submitCtfAnswer as submitCtfAnswerService,
} from "../services/ctfService.js";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/responseHandler.js";
import { presentCTF, presentCTFs } from "../presenters/ctfPresenter.js";

/**
 * Get all CTF data
 */
export const getCTFData = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED);
    }

    const { search, category, difficulty, status } = req.query;
    const filters = { search, category, difficulty, status };

    const ctfData = await getCTFDataService(userId, filters);

    if (!ctfData) {
      return sendError(res, ERROR_CODES.CTF_NOT_FOUND);
    }

    // Format data
    ctfData.challenges = ctfData.challenges || [];
    ctfData.category_progress = ctfData.category_progress || [];

    return sendSuccess(res, ctfData);
  } catch (error) {
    console.error("Error fetching CTF data:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi khi lấy dữ liệu CTF");
  }
};

/**
 * Get CTF by ID
 */
export const getCtfById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Get user ID from authenticated user

    if (!id) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Thiếu ID CTF");
    }

    // Validate id is a number
    const ctfId = parseInt(id, 10);
    if (isNaN(ctfId)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "ID CTF không hợp lệ");
    }

    const ctf = await getCtfByIdService(ctfId, userId);

    if (!ctf) {
      return sendError(res, ERROR_CODES.CTF_NOT_FOUND);
    }

    return sendSuccess(res, presentCTF(ctf));
  } catch (error) {
    console.error("Error fetching CTF:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi lấy chi tiết CTF");
  }
};

/**
 * Create a new CTF
 */
export const createCtf = async (req, res) => {
  try {
    const { ten, mota, loaictf, tacgia, choai, pdf_url, points, duration } = req.body;

    if (!ten || !loaictf || !tacgia || !choai) {
      return sendError(res, ERROR_CODES.CTF_REQUIRED_FIELDS_MISSING);
    }

    const ctf = await createCtfService({
      ten,
      mota,
      loaictf,
      tacgia,
      choai,
      pdf_url,
      points,
      duration,
    });

    return sendSuccess(res, presentCTF(ctf), "Tạo CTF thành công", 201);
  } catch (error) {
    console.error("Error creating CTF:", error);
    if (error.message.includes("Thiếu field")) {
      return sendError(res, ERROR_CODES.CTF_REQUIRED_FIELDS_MISSING);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi tạo CTF");
  }
};

/**
 * Update CTF
 */
export const updateCtf = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten, mota, loaictf, tacgia, choai, pdf_url, points, duration } = req.body;

    if (!id) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Thiếu ID CTF");
    }

    const ctfId = parseInt(id, 10);
    if (isNaN(ctfId)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "ID CTF không hợp lệ");
    }

    const ctf = await updateCtfService(ctfId, {
      ten,
      mota,
      loaictf,
      tacgia,
      choai,
      pdf_url,
      points,
      duration,
    });

    return sendSuccess(res, presentCTF(ctf), "Cập nhật CTF thành công");
  } catch (error) {
    console.error("Error updating CTF:", error);
    if (error.message.includes("CTF không tồn tại")) {
      return sendError(res, ERROR_CODES.CTF_NOT_FOUND);
    }
    if (error.message.includes("Không có field")) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, error.message);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi cập nhật CTF");
  }
};

/**
 * Delete CTF
 */
export const deleteCtf = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Thiếu ID CTF");
    }

    const ctfId = parseInt(id, 10);
    if (isNaN(ctfId)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "ID CTF không hợp lệ");
    }

    const ctf = await deleteCtfService(ctfId);

    return sendSuccess(res, presentCTF(ctf), "Xóa CTF thành công");
  } catch (error) {
    console.error("Error deleting CTF:", error);
    if (error.message.includes("CTF không tồn tại")) {
      return sendError(res, ERROR_CODES.CTF_NOT_FOUND);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi xóa CTF");
  }
};

/**
 * Submit CTF answer
 */
export const submitCtfAnswer = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { answerText, answerFileUrl } = req.body;

    if (!id) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Thiếu ID CTF");
    }

    const ctfId = parseInt(id, 10);
    if (isNaN(ctfId)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "ID CTF không hợp lệ");
    }

    if (!answerText && !answerFileUrl) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Phải cung cấp ít nhất một trong hai: đáp án text hoặc file");
    }

    const result = await submitCtfAnswerService(userId, ctfId, answerText, answerFileUrl);

    return sendSuccess(res, result, "Nộp đáp án thành công! Điểm đã được cập nhật.");
  } catch (error) {
    console.error("Error submitting CTF answer:", error);
    if (error.message.includes("CTF không tồn tại")) {
      return sendError(res, ERROR_CODES.CTF_NOT_FOUND);
    }
    if (error.message.includes("Phải cung cấp")) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, error.message);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi nộp đáp án");
  }
};

