/**
 * Course Service
 * Handles business logic and database queries for courses
 */
import pool from "../config/db.js";
import { CourseModel } from "../models/Course.js";
import { executeQuery } from "../utils/queryHelpers.js";

/**
 * Get all courses with tags and level
 */
export const getAllCourses = async () => {
  const query = `
    SELECT 
        kh.id,
        kh.ten AS title,
        kh.mota AS description,
        kh.thoiluong,
        CASE 
            WHEN kh.thoiluong > 0 THEN (kh.thoiluong / 40)::TEXT || ' tuần'
            ELSE 'Tự học' 
        END AS duration,
        (kh.danhgia::DECIMAL / 10)::TEXT AS rating,
        STRING_AGG(t.mota, ', ') AS tags,
        (SELECT MIN(bh.capdo) FROM baihoc bh WHERE bh.id_khoahoc = kh.id) AS level
    FROM khoahoc kh
    LEFT JOIN tag t ON t.id_khoahoc = kh.id
    GROUP BY kh.id, kh.ten, kh.mota, kh.thoiluong, kh.danhgia
    ORDER BY kh.id
    LIMIT 12;
  `;

  const result = await pool.query(query);
  return result.rows;
};

/**
 * Get course detail with progress
 */
export const getCourseDetail = async (courseId, userId) => {
  const query = `
    WITH course_info AS (
      SELECT 
        kh.id,
        kh.ten AS title,
        kh.mota AS description,
        kh.thoiluong AS total_duration,
        kh.danhgia AS rating
      FROM khoahoc kh
      WHERE kh.id = $1
    ),
    user_enrollment AS (
      SELECT COUNT(*) > 0 AS is_enrolled
      FROM user_khoahoc uk
      WHERE uk.user_id = $2 AND uk.khoahoc_id = $1
    ),
    progress AS (
      SELECT 
        COUNT(ub.hoanthanh_baihoc) FILTER (WHERE ub.hoanthanh_baihoc = true) AS completed_count,
        COUNT(*) AS total_count,
        ROUND((COUNT(ub.hoanthanh_baihoc) FILTER (WHERE ub.hoanthanh_baihoc = true)::DECIMAL / GREATEST(COUNT(*), 1) * 100), 2) AS progress_percentage
      FROM baihoc bh
      LEFT JOIN user_baihoc ub ON ub.baihoc_id = bh.id AND ub.user_id = $2
      WHERE bh.id_khoahoc = $1
    ),
    lessons AS (
      SELECT 
        bh.id,
        bh.ten AS title,
        COALESCE(bh.mota, bh.ten) AS description,
        bh.thoiluong,
        CASE WHEN bh.thoiluong > 0 THEN bh.thoiluong::TEXT || ' phút' ELSE 'N/A' END AS duration,
        COALESCE(ub.hoanthanh_baihoc, false) AS is_completed,
        CASE 
          WHEN (SELECT is_enrolled FROM user_enrollment) = false THEN true
          WHEN u.role IN ('user', 'admin') THEN 
            (SELECT COUNT(*) >= 2 
             FROM baihoc bh2 
             WHERE bh2.id_khoahoc = $1 AND bh2.id <= bh.id)
          ELSE false
        END AS is_locked,
        CASE 
          WHEN (SELECT completed_count FROM progress) = 0 AND bh.id = (SELECT MIN(id) FROM baihoc WHERE id_khoahoc = $1) THEN true
          WHEN NOT COALESCE(ub.hoanthanh_baihoc, false) AND LAG(COALESCE(ub.hoanthanh_baihoc, false)) OVER (ORDER BY bh.id) = true THEN true
          ELSE false
        END AS is_active
      FROM baihoc bh
      LEFT JOIN user_baihoc ub ON ub.baihoc_id = bh.id AND ub.user_id = $2
      INNER JOIN users u ON u.id = $2
      WHERE bh.id_khoahoc = $1
      ORDER BY bh.id
    )
    SELECT 
      CASE 
        WHEN (SELECT is_enrolled FROM user_enrollment) = false THEN NULL
        ELSE ci.title
      END AS course_title,
      CASE 
        WHEN (SELECT is_enrolled FROM user_enrollment) = false THEN NULL
        ELSE ci.description
      END AS course_description,
      CASE 
        WHEN (SELECT is_enrolled FROM user_enrollment) = false THEN NULL
        ELSE ci.total_duration
      END AS total_duration,
      CASE 
        WHEN (SELECT is_enrolled FROM user_enrollment) = false THEN NULL
        ELSE (ci.rating::DECIMAL / 10)::TEXT
      END AS rating_formatted,
      CASE 
        WHEN (SELECT is_enrolled FROM user_enrollment) = false THEN NULL
        ELSE p.completed_count
      END AS completed_count,
      CASE 
        WHEN (SELECT is_enrolled FROM user_enrollment) = false THEN NULL
        ELSE p.total_count
      END AS total_count,
      CASE 
        WHEN (SELECT is_enrolled FROM user_enrollment) = false THEN NULL
        ELSE p.progress_percentage
      END AS progress_percentage,
      CASE 
        WHEN (SELECT is_enrolled FROM user_enrollment) = false THEN NULL
        ELSE json_agg(
          json_build_object(
            'id', l.id,
            'title', l.title,
            'description', l.description,
            'duration', l.duration,
            'isCompleted', l.is_completed,
            'isLocked', l.is_locked,
            'isActive', l.is_active
          )
        ) FILTER (WHERE l.id IS NOT NULL)
      END AS lessons
    FROM course_info ci
    CROSS JOIN progress p
    LEFT JOIN lessons l ON true
    GROUP BY ci.id, ci.title, ci.description, ci.total_duration, ci.rating, p.completed_count, p.total_count, p.progress_percentage;
  `;

  const result = await pool.query(query, [courseId, userId]);
  return result.rows[0];
};

/**
 * Get course content (lesson content)
 */
export const getCourseContent = async (lessonId, userId) => {
  const query = `
    WITH lesson_base AS (
      SELECT 
        bh.id AS lesson_id,
        bh.ten AS lesson_title,
        bh.mota AS lesson_description,
        kh.id AS course_id,
        kh.ten AS course_title,
        kh.mota AS course_description
      FROM baihoc bh
      INNER JOIN khoahoc kh ON kh.id = bh.id_khoahoc
      WHERE bh.id = $1
    ),
    featured_doc AS (
      SELECT 
        lb.lesson_id,
        lb.course_id,
        lb.course_title,
        lb.course_description,
        lb.lesson_title,
        lb.lesson_description,
        t.ten AS featured_title,
        t.loai AS featured_type,
        t.url AS featured_url,
        lb.lesson_description AS featured_description
      FROM lesson_base lb
      LEFT JOIN tailieu t ON t.id_baihoc = lb.lesson_id AND t.loai ILIKE '%pdf%' 
      WHERE (t.ten ILIKE '%giáo trình%' OR t.id IS NULL)
      ORDER BY CASE WHEN t.ten ILIKE '%giáo trình%' THEN 0 ELSE 1 END, t.id
      LIMIT 1
    ),
    additional_docs AS (
      SELECT 
        lb.lesson_id,
        lb.course_title,
        json_agg(
          json_build_object(
            'title', COALESCE(t.ten, 'Tài liệu bổ sung'),
            'type', CASE 
              WHEN t.loai ILIKE '%ppt%' THEN t.loai || ' • 25 slides'
              WHEN t.loai ILIKE '%exercise%' OR t.loai ILIKE '%bài tập%' THEN t.loai || ' • 10 bài tập có lời giải'
              ELSE t.loai || ' • Chi tiết bổ sung'
            END,
            'url', COALESCE(t.url, 'https://example.com/default.pdf')
          ) ORDER BY t.id
        ) FILTER (WHERE t.id IS NOT NULL) AS additional_materials
      FROM lesson_base lb
      LEFT JOIN tailieu t ON t.id_baihoc = lb.lesson_id AND t.id != COALESCE((SELECT t2.id FROM tailieu t2 WHERE t2.id_baihoc = lb.lesson_id AND t2.ten ILIKE '%giáo trình%' LIMIT 1), 0)
      GROUP BY lb.lesson_id, lb.course_title
    ),
    objectives AS (
      SELECT 
        lb.lesson_id,
        lb.lesson_title,
        lb.lesson_description,
        bh.muctieu AS objectives_array
      FROM lesson_base lb
      LEFT JOIN baihoc bh ON bh.id = lb.lesson_id
      WHERE bh.muctieu != '[]'::JSONB OR true
    )
    SELECT 
      lb.course_title AS course_title,
      lb.lesson_title AS lesson_title,
      COALESCE(fd.featured_title, 'Giáo trình bài học cơ bản') AS featured_title,
      COALESCE(fd.featured_type, 'PDF') || ' • 45 trang • Cập nhật 2024' AS featured_info,
      COALESCE(fd.featured_url, 'https://example.com/giao-trinh.pdf') AS featured_url,
      COALESCE(fd.featured_description, lb.lesson_description) AS featured_description,
      COALESCE(ad.additional_materials, '[]'::JSON) AS additional_materials,
      COALESCE(
        o.objectives_array::JSON,
        '[{"number":1,"title":"Hiểu khái niệm chính của bài học","description":"Nắm vững định nghĩa và tầm quan trọng của nội dung bài"},{"number":2,"title":"Áp dụng kiến thức","description":"Thực hành các nguyên tắc cơ bản từ bài học"}]'::JSON
      ) AS objectives
    FROM lesson_base lb
    LEFT JOIN featured_doc fd ON fd.lesson_id = lb.lesson_id
    LEFT JOIN additional_docs ad ON ad.lesson_id = lb.lesson_id
    LEFT JOIN objectives o ON o.lesson_id = lb.lesson_id;
  `;

  const result = await pool.query(query, [parseInt(lessonId)]);
  return result.rows[0];
};

/**
 * Get courses for management page
 */
export const getCoursesForManagement = async () => {
  const sidebarQuery = `
    WITH category_counts AS (
      SELECT 
        COALESCE(t.mota, 'Misc') AS category,
        COUNT(DISTINCT kh.id) AS count
      FROM khoahoc kh
      LEFT JOIN tag t ON t.id_khoahoc = kh.id
      GROUP BY t.mota
    ),
    status_counts AS (
      SELECT 
        CASE 
          WHEN uk.trangthai = 'completed' THEN 'published'
          WHEN uk.trangthai = 'in_progress' THEN 'draft'
          WHEN uk.trangthai = 'not_started' THEN 'scheduled'
          ELSE 'published'
        END AS status,
        COUNT(DISTINCT kh.id) AS count
      FROM khoahoc kh
      LEFT JOIN user_khoahoc uk ON uk.khoahoc_id = kh.id
      GROUP BY CASE 
        WHEN uk.trangthai = 'completed' THEN 'published'
        WHEN uk.trangthai = 'in_progress' THEN 'draft'
        WHEN uk.trangthai = 'not_started' THEN 'scheduled'
        ELSE 'published'
      END
    ),
    overview AS (
      SELECT 
        COUNT(DISTINCT kh.id) AS total_courses,
        COUNT(DISTINCT uk.user_id) AS total_students,
        COALESCE(
          ROUND(AVG(CASE WHEN ub.hoanthanh_baihoc THEN 1 ELSE 0 END)::DECIMAL * 100, 2),
          0
        ) AS completion_rate
      FROM khoahoc kh
      LEFT JOIN user_khoahoc uk ON uk.khoahoc_id = kh.id
      LEFT JOIN user_baihoc ub ON ub.user_id = uk.user_id
      AND EXISTS (SELECT 1 FROM baihoc bh WHERE bh.id_khoahoc = kh.id AND bh.id = ub.baihoc_id)
    )
    SELECT 
      (SELECT json_agg(
        json_build_object(
          'category', COALESCE(category, 'Misc'),
          'count', count
        ) ORDER BY category
      ) FROM category_counts) AS categories,
      (SELECT json_agg(
        json_build_object(
          'status', status,
          'count', count
        ) ORDER BY status
      ) FROM status_counts) AS statuses,
      (SELECT json_build_object(
        'total_courses', total_courses,
        'total_students', total_students,
        'completion_rate', completion_rate
      ) FROM overview) AS overview;
  `;

  const coursesQuery = `
    SELECT 
      kh.id,
      kh.ten AS title,
      kh.mota AS description,
      CASE kh.id
        WHEN 1 THEN 'Security Expert'
        WHEN 2 THEN 'Ethical Hacker Pro'
        WHEN 3 THEN 'Reverse Engineering'
        WHEN 4 THEN 'Web Security'
        WHEN 5 THEN 'Forensics Expert'
        WHEN 6 THEN 'Mobile Security'
        WHEN 7 THEN 'AWS Instructor'
        WHEN 8 THEN 'Awareness Trainer'
        WHEN 9 THEN 'IAM Specialist'
        WHEN 10 THEN 'Encryption Expert'
        WHEN 11 THEN 'Firewall Admin'
        WHEN 12 THEN 'Incident Manager'
        ELSE 'Unknown Instructor'
      END AS instructor,
      CASE kh.id
        WHEN 1 THEN '2 ngày trước'
        WHEN 2 THEN '1 tuần trước'
        WHEN 3 THEN '3 ngày trước'
        WHEN 4 THEN '5 ngày trước'
        WHEN 5 THEN '1 ngày trước'
        WHEN 6 THEN '4 ngày trước'
        WHEN 7 THEN '6 ngày trước'
        WHEN 8 THEN '2 tuần trước'
        WHEN 9 THEN '3 tuần trước'
        WHEN 10 THEN '4 ngày trước'
        WHEN 11 THEN '5 ngày trước'
        WHEN 12 THEN '1 ngày trước'
        ELSE '0 ngày trước'
      END AS time_ago,
      kh.danhgia / 10.0 AS rating,
      (
        SELECT COALESCE(bh.capdo, 'basic')
        FROM baihoc bh
        WHERE bh.id_khoahoc = kh.id
        GROUP BY bh.capdo
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS level,
      COALESCE(
        (SELECT CASE uk.trangthai
          WHEN 'completed' THEN 'published'
          WHEN 'in_progress' THEN 'draft'
          WHEN 'not_started' THEN 'scheduled'
          ELSE 'published'
        END
        FROM user_khoahoc uk
        WHERE uk.khoahoc_id = kh.id
        GROUP BY uk.trangthai
        ORDER BY COUNT(*) DESC
        LIMIT 1),
        'published'
      ) AS status,
      CASE kh.id
        WHEN 1 THEN 'https://picsum.photos/400?random=1'
        WHEN 2 THEN 'https://picsum.photos/400?random=2'
        WHEN 3 THEN 'https://picsum.photos/400?random=3'
        WHEN 4 THEN 'https://picsum.photos/400?random=4'
        WHEN 5 THEN 'https://picsum.photos/400?random=5'
        WHEN 6 THEN 'https://picsum.photos/400?random=6'
        WHEN 7 THEN 'https://picsum.photos/400?random=7'
        WHEN 8 THEN 'https://picsum.photos/400?random=8'
        WHEN 9 THEN 'https://picsum.photos/400?random=9'
        WHEN 10 THEN 'https://picsum.photos/400?random=10'
        WHEN 11 THEN 'https://picsum.photos/400?random=11'
        WHEN 12 THEN 'https://picsum.photos/400?random=12'
        ELSE 'https://picsum.photos/400?random=0'
      END AS image,
      COUNT(DISTINCT uk.user_id) AS students,
      COALESCE(
        ROUND(AVG(CASE WHEN ub.hoanthanh_baihoc THEN 1 ELSE 0 END)::DECIMAL * 100, 2),
        0
      ) AS completion,
      CASE kh.id
        WHEN 1 THEN 156
        WHEN 2 THEN 89
        WHEN 3 THEN 67
        WHEN 4 THEN 94
        WHEN 5 THEN 45
        WHEN 6 THEN 72
        WHEN 7 THEN 120
        WHEN 8 THEN 80
        WHEN 9 THEN 90
        WHEN 10 THEN 110
        WHEN 11 THEN 85
        WHEN 12 THEN 100
        ELSE 0
      END AS reviews,
      COALESCE(kh.thoiluong / 60 || ' phút', '0 phút') AS avg_view_time,
      COALESCE(
        (SELECT json_agg(t.mota)::JSON
         FROM tag t
         WHERE t.id_khoahoc = kh.id),
        '[]'::JSON
      ) AS tags
    FROM khoahoc kh
    LEFT JOIN user_khoahoc uk ON uk.khoahoc_id = kh.id
    LEFT JOIN user_baihoc ub ON ub.user_id = uk.user_id
    AND EXISTS (SELECT 1 FROM baihoc bh WHERE bh.id_khoahoc = kh.id AND bh.id = ub.baihoc_id)
    GROUP BY kh.id, kh.ten, kh.mota, kh.danhgia, kh.thoiluong
    ORDER BY kh.id;
  `;

  const [sidebarResult, coursesResult] = await Promise.all([
    pool.query(sidebarQuery),
    pool.query(coursesQuery),
  ]);

  return {
    sidebar: sidebarResult.rows[0],
    courses: coursesResult.rows,
  };
};

/**
 * Get test info for a course
 */
export const getCourseTest = async (courseId, userId) => {
  const query = `
    SELECT 
      bt.id,
      bt.ten AS title,
      bt.thoiluong::TEXT || ' phút' AS duration,
      ubt.diemso,
      ubt.trangthai AS status
    FROM baikiemtra bt
    LEFT JOIN user_baikiemtra ubt ON ubt.baikiemtra_id = bt.id AND ubt.user_id = $1
    WHERE bt.id = (SELECT id_baikiemtra FROM khoahoc WHERE id = $2);
  `;

  const result = await pool.query(query, [userId, courseId]);
  return result.rows[0] || null;
};

/**
 * Enroll user into a course
 */
export const enrollCourse = async (courseId, userId) => {
  // Check if course exists
  const course = await pool.query("SELECT id FROM khoahoc WHERE id = $1", [courseId]);
  if (course.rows.length === 0) {
    throw new Error("Khóa học không tồn tại");
  }

  // Check if user is already enrolled
  const existingEnrollment = await pool.query(
    "SELECT * FROM user_khoahoc WHERE user_id = $1 AND khoahoc_id = $2",
    [userId, courseId]
  );

  if (existingEnrollment.rows.length > 0) {
    throw new Error("Bạn đã đăng ký khóa học này rồi");
  }

  // Enroll user with "in-progress" status
  const result = await pool.query(
    "INSERT INTO user_khoahoc (user_id, khoahoc_id, trangthai) VALUES ($1, $2, $3) RETURNING *",
    [userId, courseId, "in-progress"]
  );

  return result.rows[0];
};

