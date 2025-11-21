/**
 * Lab Controller
 * Handles request/response for lab endpoints
 */
import {
  getLabsData as getLabsDataService,
  getLabById as getLabByIdService,
  createLab as createLabService,
} from "../services/labService.js";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/responseHandler.js";
import { presentLab, presentLabs } from "../presenters/labPresenter.js";

/**
 * Get all labs
 */
export const getLabsData = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED);
    }

    const labsData = await getLabsDataService(userId);

    if (!labsData) {
      return sendError(res, ERROR_CODES.LAB_NOT_FOUND);
    }

    // Format data
    labsData.labs = labsData.labs || [];
    labsData.category_progress = labsData.category_progress || [];
    labsData.achievements = labsData.achievements || [];
    labsData.completed_labs_count = labsData.completed_labs_count || 28;
    labsData.total_hours = labsData.total_hours || 156;
    labsData.total_xp = labsData.total_xp || 4250;
    labsData.rank = labsData.rank || "#127";

    return sendSuccess(res, labsData);
  } catch (error) {
    console.error("Error fetching Labs data:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi khi lấy dữ liệu Labs");
  }
};

/**
 * Get lab by ID
 */
export const getLabById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Thiếu ID lab");
    }

    // Validate id is a number
    const labId = parseInt(id, 10);
    if (isNaN(labId)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "ID lab không hợp lệ");
    }

    const lab = await getLabByIdService(labId);

    if (!lab) {
      return sendError(res, ERROR_CODES.LAB_NOT_FOUND);
    }

    return sendSuccess(res, presentLab(lab));
  } catch (error) {
    console.error("Error fetching lab:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi lấy chi tiết Lab");
  }
};

/**
 * Create a new lab
 */
export const createLab = async (req, res) => {
  try {
    const { ten, loai, mota, pdf_url } = req.body;

    if (!ten || !loai) {
      return sendError(res, ERROR_CODES.LAB_REQUIRED_FIELDS_MISSING);
    }

    const lab = await createLabService({ ten, loai, mota, pdf_url });

    return sendSuccess(res, presentLab(lab), "Tạo Lab thành công", 201);
  } catch (error) {
    console.error("Error creating lab:", error);
    if (error.message.includes("Thiếu field")) {
      return sendError(res, ERROR_CODES.LAB_REQUIRED_FIELDS_MISSING);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi tạo Lab");
  }
};

