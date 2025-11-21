/**
 * Course Presenter
 * Formats course data for client responses
 */

/**
 * Present a single course
 * @param {Object} course - Course object from database
 * @returns {Object} - Formatted course object
 */
export const presentCourse = (course) => {
  if (!course) return null;

  return {
    id: course.id,
    title: course.ten || course.title,
    description: course.mota || course.description,
    duration: course.thoiluong,
    rating: course.danhgia,
    testId: course.id_baikiemtra,
  };
};

/**
 * Present multiple courses
 * @param {Array} courses - Array of course objects
 * @returns {Array} - Array of formatted course objects
 */
export const presentCourses = (courses) => {
  if (!Array.isArray(courses)) return [];
  return courses.map(presentCourse);
};

