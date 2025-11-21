/**
 * Lab Service
 * Handles business logic and database queries for labs
 */
import pool from "../config/db.js";
import { LabModel } from "../models/Lab.js";
import { getOne, create, getAll } from "../utils/queryHelpers.js";

/**
 * Get all labs with user progress
 */
export const getLabsData = async (userId) => {
  const query = `
    WITH user_progress AS (
      SELECT 
        COUNT(CASE WHEN lu.tiendo = 100 THEN 1 END) AS completed_labs,
        COUNT(*) AS total_labs,
        SUM(lu.tiendo) AS total_hours,
        (COUNT(CASE WHEN lu.tiendo = 100 THEN 1 END) * 150) AS total_xp,
        127 AS rank
      FROM lab l
      LEFT JOIN lab_user lu ON lu.lab_id = l.id AND lu.user_id = $1
    ),
    category_progress AS (
      SELECT 
        l.loai,
        COUNT(CASE WHEN lu.tiendo = 100 THEN 1 END) || '/' || COUNT(*) AS progress_count
      FROM lab l
      LEFT JOIN lab_user lu ON lu.lab_id = l.id AND lu.user_id = $1
      GROUP BY l.loai
    )
    SELECT 
      json_agg(
        json_build_object(
          'id', l.id,
          'title', l.ten,
          'description', l.mota,
          'difficulty', CASE l.loai
            WHEN 'Cơ bản' THEN 'Cơ bản'
            WHEN 'Trung cấp' THEN 'Trung cấp'
            WHEN 'Nâng cao' THEN 'Nâng cao'
            ELSE 'Cơ bản'
          END,
          'subLabsCount', CASE l.id
            WHEN 1 THEN '8 bài lab'
            WHEN 2 THEN '12 bài lab'
            WHEN 3 THEN '15 bài lab'
            WHEN 4 THEN '20 bài lab'
            WHEN 5 THEN '10 bài lab'
            WHEN 6 THEN '14 bài lab'
            ELSE 'N/A'
          END,
          'progress', lu.tiendo || '%',
          'status', CASE 
            WHEN lu.tiendo = 100 THEN 'completed'
            WHEN lu.tiendo > 0 THEN 'in-progress'
            ELSE 'locked'
          END,
          'icon', CASE l.loai
            WHEN 'Network' THEN 'Wifi'
            WHEN 'Web' THEN 'Database'
            WHEN 'Binary' THEN 'Code2'
            WHEN 'Forensics' THEN 'Search'
            WHEN 'Mobile' THEN 'Activity'
            WHEN 'Security' THEN 'Shield'
            ELSE 'Shield'
          END
        ) ORDER BY l.id
      ) AS labs,
      up.completed_labs AS completed_labs_count,
      up.total_hours AS total_hours,
      up.total_xp AS total_xp,
      '#' || up.rank AS rank,
      json_agg(
        json_build_object(
          'name', COALESCE(cp.loai, 'Misc'),
          'progress', COALESCE(cp.progress_count, '0/0')
        ) ORDER BY cp.loai
      ) AS category_progress,
      '[{"title":"First Blood","description":"Hoàn thành Lab đầu tiên","icon":"Flag"},{"title":"Security Expert","description":"Hoàn thành 25 labs","icon":"Shield"},{"title":"Time Master","description":"100+ giờ thực hành","icon":"Clock"}]'::JSON AS achievements
    FROM lab l
    LEFT JOIN lab_user lu ON lu.lab_id = l.id AND lu.user_id = $1
    CROSS JOIN user_progress up
    LEFT JOIN category_progress cp ON true
    WHERE l.id <= 6
    GROUP BY up.completed_labs, up.total_hours, up.total_xp, up.rank;
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

/**
 * Get lab by ID
 */
export const getLabById = async (id) => {
  return await getOne(LabModel.tableName, id);
};

/**
 * Create a new lab
 */
export const createLab = async (labData) => {
  const { ten, loai, mota, pdf_url } = labData;
  
  if (!ten || !loai) {
    throw new Error("Thiếu field required: ten và loai");
  }

  return await create(LabModel.tableName, {
    ten,
    loai,
    mota: mota || null,
    pdf_url: pdf_url || null,
  });
};

