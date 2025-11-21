/**
 * User Controller
 * Handles user-related requests/responses
 */
import {
  getUserDashboard as getUserDashboardService,
  getAdminDashboard as getAdminDashboardService,
} from "../services/userService.js";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/responseHandler.js";

/**
 * Get user dashboard
 */
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, ERROR_CODES.USER_NOT_FOUND);
    }

    const dashboardData = await getUserDashboardService(userId);

    return sendSuccess(res, dashboardData);
  } catch (error) {
    console.error("getUserDashboard error:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi khi lấy dữ liệu dashboard");
  }
};

/**
 * Get admin dashboard
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const dashboardData = await getAdminDashboardService();

    // Format data
    dashboardData.stats = dashboardData.stats || [];
    dashboardData.systemMetrics = dashboardData.systemmetrics || [];
    dashboardData.recentActivities = dashboardData.recentactivities || [];
    dashboardData.actionCards = dashboardData.actioncards || [];

    return sendSuccess(res, dashboardData);
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi khi lấy dashboard");
  }
};
