/**
 * Course Controller
 * Handles request/response, delegates business logic to services
 */
import {
  getAllCourses as getAllCoursesService,
  getCourseDetail as getCourseDetailService,
  getCourseContent as getCourseContentService,
  getCoursesForManagement as getCoursesForManagementService,
  getCourseTest as getCourseTestService,
  enrollCourse as enrollCourseService,
} from "../services/courseService.js";
import { sendSuccess, sendError, ERROR_CODES } from "../utils/responseHandler.js";

/**
 * Get all courses
 */
export const getAllCourses = async (req, res) => {
  try {
    const courses = await getAllCoursesService();

    // Format data for frontend
    const levelIcons = {
      "Cơ bản": "Shield",
      "Trung cấp": "Globe",
      "Nâng cao": "Eye",
    };

    const formattedCourses = courses.map((course) => {
      const tagArray = course.tags
        ? course.tags
            .split(", ")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      return {
        id: course.id,
        image: `https://picsum.photos/400?random=${course.id}`,
        level: course.level || "Cơ bản",
        levelIcon: levelIcons[course.level] || "Shield",
        title: course.title,
        description: course.description,
        tags: tagArray,
        duration: course.duration || "8 tuần",
        rating: course.rating || "4.8",
      };
    });

    const response = {
      stats: {
        students: "50K+",
        courses: "200+",
        jobRate: "95%",
        support: "24/7",
      },
      courses: formattedCourses,
    };

    return sendSuccess(res, response);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Error fetching courses");
  }
};

/**
 * Get course detail
 */
export const getCourseDetail = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED);
    }

    if (!courseId) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Thiếu ID khóa học");
    }

    // Validate courseId is a number
    const courseIdNum = parseInt(courseId, 10);
    if (isNaN(courseIdNum)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "ID khóa học không hợp lệ");
    }

    const courseData = await getCourseDetailService(courseIdNum, userId);

    if (!courseData || courseData.course_title === null) {
      return sendError(res, ERROR_CODES.COURSE_NOT_ENROLLED);
    }

    // Format progress percentage
    courseData.progressPercentage = courseData.progress_percentage + "%";

    // Get test info
    const test = await getCourseTestService(courseIdNum, userId);
    courseData.test = test;

    return sendSuccess(res, courseData);
  } catch (error) {
    console.error("Error fetching course detail:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi khi lấy chi tiết khóa học");
  }
};

/**
 * Get course content (lesson content)
 */
export const getCourseContent = async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user?.id;

    if (!lessonId) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Thiếu ID bài học");
    }

    if (!userId) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED);
    }

    // Validate lessonId is a number
    const lessonIdNum = parseInt(lessonId, 10);
    if (isNaN(lessonIdNum)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "ID bài học không hợp lệ");
    }

    const contentData = await getCourseContentService(lessonIdNum, userId);

    if (!contentData) {
      return sendError(res, ERROR_CODES.LESSON_CONTENT_NOT_FOUND);
    }

    // Fallback for additional materials
    if (!contentData.additional_materials || contentData.additional_materials.length === 0) {
      contentData.additional_materials = [
        {
          title: "Slide thuyết trình bài học",
          type: "PowerPoint • 25 slides",
          url: "https://example.com/slides.ppt",
        },
        {
          title: "Bài tập thực hành bài học",
          type: "PDF • 10 bài tập có lời giải",
          url: "https://example.com/exercises.pdf",
        },
      ];
    }

    return sendSuccess(res, contentData);
  } catch (error) {
    console.error("Error fetching lesson content:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi khi lấy nội dung bài học");
  }
};

/**
 * Get courses for management page
 */
export const getCourses = async (req, res) => {
  try {
    const result = await getCoursesForManagementService();

    // Hard-code categories if needed
    const defaultCategories = [
      { category: "Network Security", count: 1 },
      { category: "Basic Security", count: 1 },
      { category: "Penetration Testing", count: 1 },
      { category: "Ethical Hacking", count: 1 },
      { category: "Malware Analysis", count: 1 },
      { category: "Reverse Engineering", count: 1 },
      { category: "OWASP Top 10", count: 1 },
      { category: "SQL Injection", count: 1 },
      { category: "Digital Investigation", count: 1 },
      { category: "Evidence Collection", count: 1 },
      { category: "Mobile Android", count: 1 },
      { category: "Mobile iOS", count: 1 },
      { category: "Awareness Training", count: 1 },
      { category: "AWS Security", count: 1 },
      { category: "Basic Concepts", count: 1 },
      { category: "Cloud IAM", count: 1 },
      { category: "Encryption", count: 1 },
      { category: "Firewall", count: 1 },
      { category: "Hardware Security", count: 1 },
      { category: "IDS/IPS", count: 1 },
      { category: "Incident Management", count: 1 },
      { category: "IoT Protocols", count: 1 },
      { category: "Key Management", count: 1 },
      { category: "Phishing Defense", count: 1 },
      { category: "Recovery Planning", count: 1 },
    ];

    const fetchedCategories = result.sidebar.categories || [];
    const mergedCategories = [
      ...fetchedCategories,
      ...defaultCategories.filter(
        (dc) => !fetchedCategories.some((fc) => fc.category === dc.category)
      ),
    ];

    const response = {
      sidebar: {
        categories: mergedCategories,
        statuses: result.sidebar.statuses || [
          { status: "published", count: 4 },
          { status: "draft", count: 1 },
          { status: "scheduled", count: 1 },
        ],
        overview: result.sidebar.overview || {
          total_courses: 6,
          total_students: 0,
          completion_rate: 0,
        },
      },
      courses: result.courses,
    };

    return sendSuccess(res, response);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi khi lấy dữ liệu khóa học");
  }
};

/**
 * Upload course from Word file
 */
export const uploadCourse = async (req, res) => {
  // This will be handled by multer middleware
  // For now, keeping the original implementation
  // TODO: Move to service
  return sendError(res, ERROR_CODES.SERVER_ERROR, "Upload course feature needs to be migrated to service");
};

/**
 * Enroll user into a course
 */
export const enrollCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, ERROR_CODES.UNAUTHORIZED);
    }

    if (!courseId) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Thiếu ID khóa học");
    }

    // Validate courseId is a number
    const courseIdNum = parseInt(courseId, 10);
    if (isNaN(courseIdNum)) {
      return sendError(res, ERROR_CODES.VALIDATION_ERROR, "ID khóa học không hợp lệ");
    }

    const enrollment = await enrollCourseService(courseIdNum, userId);

    return sendSuccess(
      res,
      {
        course_id: enrollment.khoahoc_id,
        status: enrollment.trangthai,
      },
      "Đăng ký khóa học thành công",
      201
    );
  } catch (error) {
    console.error("Error enrolling course:", error);
    if (error.message.includes("không tồn tại")) {
      return sendError(res, ERROR_CODES.COURSE_NOT_FOUND, error.message);
    }
    if (error.message.includes("đã đăng ký")) {
      return sendError(res, ERROR_CODES.COURSE_ALREADY_EXISTS, error.message);
    }
    return sendError(res, ERROR_CODES.SERVER_ERROR, "Lỗi server khi đăng ký khóa học");
  }
};
