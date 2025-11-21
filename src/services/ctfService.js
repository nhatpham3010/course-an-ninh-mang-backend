/**
 * CTF Service
 * Handles business logic and database queries for CTF
 */
import pool from "../config/db.js";
import { CTFModel } from "../models/CTF.js";
import { getOne, create } from "../utils/queryHelpers.js";

/**
 * Get all CTF data with filters
 */
export const getCTFData = async (userId, filters = {}) => {
  const { search, category, difficulty, status } = filters;
  
  const whereClauses = [];
  const queryParams = [userId];
  let paramIndex = 2;

  if (search) {
    whereClauses.push(`c.ten ILIKE $${paramIndex}`);
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (category) {
    whereClauses.push(`c.loaictf = $${paramIndex}`);
    queryParams.push(category);
    paramIndex++;
  }

  if (difficulty) {
    const difficultyMap = {
      Beginner: "%sinh viên%",
      Intermediate: "%mọi người%",
      Advanced: "%",
    };
    whereClauses.push(`c.choai ILIKE $${paramIndex}`);
    queryParams.push(difficultyMap[difficulty] || "%");
    paramIndex++;
  }

  if (status) {
    if (status === "completed") {
      whereClauses.push("cu.tiendo = 100");
    } else if (status === "available") {
      whereClauses.push("cu.tiendo > 0 AND cu.tiendo < 100");
    } else if (status === "locked") {
      whereClauses.push("cu.tiendo IS NULL OR cu.tiendo = 0");
    }
  }

  const whereCondition = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  const query = `
    WITH user_progress AS (
      SELECT 
        COUNT(CASE WHEN cu.tiendo = 100 THEN 1 END) AS completed_challenges,
        COUNT(*) AS total_challenges,
        SUM(CASE WHEN cu.tiendo = 100 THEN 
          CASE c.id
            WHEN 1 THEN 50
            WHEN 2 THEN 75
            WHEN 3 THEN 150
            WHEN 4 THEN 200
            WHEN 5 THEN 125
            WHEN 6 THEN 300
            ELSE 0
          END
        ELSE 0 END) AS total_points,
        ROUND((COUNT(CASE WHEN cu.tiendo = 100 THEN 1 END)::DECIMAL / GREATEST(COUNT(*), 1) * 100), 2) AS overall_percentage
      FROM ctf c
      LEFT JOIN ctf_user cu ON cu.ctf_id = c.id AND cu.user_id = $1
      ${whereCondition}
    ),
    category_progress AS (
      SELECT 
        c.loaictf,
        COUNT(CASE WHEN cu.tiendo = 100 THEN 1 END) || '/' || COUNT(*) AS progress_count
      FROM ctf c
      LEFT JOIN ctf_user cu ON cu.ctf_id = c.id AND cu.user_id = $1
      ${whereCondition}
      GROUP BY c.loaictf
    ),
    challenges_data AS (
      SELECT
        c.id,
        c.ten AS title,
        c.mota AS description,
        c.loaictf AS category,
        CASE 
          WHEN c.choai ILIKE '%sinh viên%' THEN 'Beginner'
          WHEN c.choai ILIKE '%mọi người%' THEN 'Intermediate'
          ELSE 'Advanced'
        END AS difficulty,
        CASE c.id
          WHEN 1 THEN '15 phút'
          WHEN 2 THEN '30 phút'
          WHEN 3 THEN '45 phút'
          WHEN 4 THEN '60 phút'
          WHEN 5 THEN '40 phút'
          WHEN 6 THEN '90 phút'
          ELSE 'N/A'
        END AS duration,
        c.tacgia AS author,
        CASE c.loaictf
          WHEN 'Crypto' THEN '["#caesar", "#substitution", "#basic"]'
          WHEN 'Web' THEN '["#sql", "#injection", "#database"]'
          WHEN 'Forensics' THEN '["#memory", "#volatility", "#analysis"]'
          WHEN 'Reversing' THEN '["#reverse", "#assembly", "#gdb"]'
          WHEN 'Network' THEN '["#wireshark", "#pcap", "#protocols"]'
          ELSE '[]'
        END::JSONB AS tags,
        true AS "hasHints",
        true AS "hasWriteup",
        CASE c.id
          WHEN 1 THEN 50
          WHEN 2 THEN 75
          WHEN 3 THEN 150
          WHEN 4 THEN 200
          WHEN 5 THEN 125
          WHEN 6 THEN 300
          ELSE 0
        END AS points,
        CASE 
          WHEN cu.tiendo = 100 THEN 'completed'
          WHEN cu.tiendo > 0 THEN 'available'
          ELSE 'locked'
        END AS status,
        CASE c.loaictf
          WHEN 'Crypto' THEN 'Key'
          WHEN 'Web' THEN 'Code2'
          WHEN 'Forensics' THEN 'Search'
          WHEN 'Reversing' THEN 'Target'
          WHEN 'Network' THEN 'Wifi'
          ELSE 'Shield'
        END AS icon
      FROM ctf c
      LEFT JOIN ctf_user cu ON cu.ctf_id = c.id AND cu.user_id = $1
      ${whereCondition}
    )
    SELECT 
      (SELECT json_agg(challenges_data ORDER BY id) FROM challenges_data) AS challenges,
      up.completed_challenges || '/' || up.total_challenges AS completed_total,
      up.total_points AS total_points,
      up.overall_percentage || '%' AS overall_percentage,
      (SELECT json_agg(
        json_build_object(
          'name', COALESCE(cp.loaictf, 'Misc'),
          'progress', COALESCE(cp.progress_count, '0/0'),
          'icon', CASE COALESCE(cp.loaictf, 'Misc')
            WHEN 'Crypto' THEN 'Key'
            WHEN 'Web' THEN 'Code2'
            WHEN 'Forensics' THEN 'Search'
            WHEN 'Reversing' THEN 'Target'
            WHEN 'Network' THEN 'Wifi'
            ELSE NULL
          END
        ) ORDER BY cp.loaictf
      ) FROM category_progress cp) AS category_progress,
      '[{"title":"CTF Handbook","description":"Hướng dẫn toàn diện về CTF","icon":"BookOpen"},{"title":"Tools & Scripts","description":"Công cụ hỗ trợ giải CTF","icon":"Database"},{"title":"Community","description":"Tham gia cộng đồng CTF","icon":"Users"}]'::JSONB AS learning_resources
    FROM user_progress up;
  `;

  const result = await pool.query(query, queryParams);
  return result.rows[0];
};

/**
 * Get CTF by ID with user submission status
 */
export const getCtfById = async (id, userId = null) => {
  const ctf = await getOne(CTFModel.tableName, id);
  if (!ctf) return null;
  
  // If userId is provided, check if user has submitted answer
  if (userId) {
    const userCtf = await pool.query(
      `SELECT tiendo, dap_an, dap_an_file FROM ctf_user WHERE user_id = $1 AND ctf_id = $2`,
      [userId, id]
    );
    
    if (userCtf.rows.length > 0) {
      const userData = userCtf.rows[0];
      return {
        ...ctf,
        status: userData.tiendo === 100 ? "completed" : "in_progress",
        hasSubmitted: true,
        submittedAnswer: userData.dap_an,
        submittedFile: userData.dap_an_file,
      };
    }
  }
  
  return {
    ...ctf,
    status: "available",
    hasSubmitted: false,
  };
};

/**
 * Create a new CTF
 */
export const createCtf = async (ctfData) => {
  const { ten, mota, loaictf, tacgia, choai, pdf_url, points, duration } = ctfData;
  
  if (!ten || !loaictf || !tacgia || !choai) {
    throw new Error("Thiếu field required: ten, loaictf, tacgia, choai");
  }

  return await create(CTFModel.tableName, {
    ten,
    mota: mota || null,
    loaictf,
    tacgia,
    choai,
    pdf_url: pdf_url || null,
    points: points || 0,
    duration: duration || "0 minutes",
  });
};

/**
 * Submit CTF answer
 * @param {number} userId - User ID
 * @param {number} ctfId - CTF ID
 * @param {string} answerText - Answer text (optional)
 * @param {string} answerFileUrl - Answer file URL (optional)
 * @returns {Promise<Object>} - Updated CTF user record
 */
export const submitCtfAnswer = async (userId, ctfId, answerText = null, answerFileUrl = null) => {
  if (!answerText && !answerFileUrl) {
    throw new Error("Phải cung cấp ít nhất một trong hai: đáp án text hoặc file");
  }

  // Check if CTF exists
  const ctf = await getCtfById(ctfId);
  if (!ctf) {
    throw new Error("CTF không tồn tại");
  }

  // Check if record exists in ctf_user
  const existingRecord = await pool.query(
    `SELECT * FROM ctf_user WHERE user_id = $1 AND ctf_id = $2`,
    [userId, ctfId]
  );

  let result;
  if (existingRecord.rows.length > 0) {
    // Update existing record
    const updateData = {};
    if (answerText) updateData.dap_an = answerText;
    if (answerFileUrl) updateData.dap_an_file = answerFileUrl;
    // Update tiendo to 100 (completed) when answer is submitted
    updateData.tiendo = 100;

    result = await pool.query(
      `UPDATE ctf_user 
       SET dap_an = COALESCE($1, dap_an), 
           dap_an_file = COALESCE($2, dap_an_file),
           tiendo = 100
       WHERE user_id = $3 AND ctf_id = $4
       RETURNING *`,
      [answerText, answerFileUrl, userId, ctfId]
    );
  } else {
    // Create new record
    result = await pool.query(
      `INSERT INTO ctf_user (user_id, ctf_id, tiendo, dap_an, dap_an_file)
       VALUES ($1, $2, 100, $3, $4)
       RETURNING *`,
      [userId, ctfId, answerText, answerFileUrl]
    );
  }

  return result.rows[0];
};

