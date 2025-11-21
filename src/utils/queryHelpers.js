/**
 * Query Helper Functions
 * Common database query operations
 */
import pool from "../config/db.js";

/**
 * Get one record by ID
 * @param {string} tableName - Table name
 * @param {number} id - Record ID
 * @param {string} idColumn - ID column name (default: 'id')
 * @returns {Promise<Object|null>} - Record or null
 */
export const getOne = async (tableName, id, idColumn = "id") => {
  try {
    const query = `SELECT * FROM ${tableName} WHERE ${idColumn} = $1`;
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw new Error(`Error getting ${tableName} by ${idColumn}: ${error.message}`);
  }
};

/**
 * Get all records with optional conditions
 * @param {string} tableName - Table name
 * @param {Object} conditions - WHERE conditions object
 * @param {Object} options - Query options (limit, offset, orderBy)
 * @returns {Promise<Array>} - Array of records
 */
export const getAll = async (tableName, conditions = {}, options = {}) => {
  try {
    let query = `SELECT * FROM ${tableName}`;
    const params = [];
    let paramIndex = 1;

    // Build WHERE clause
    const whereClauses = [];
    for (const [key, value] of Object.entries(conditions)) {
      whereClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    // Add ORDER BY
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }

    // Add LIMIT and OFFSET
    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    throw new Error(`Error getting all ${tableName}: ${error.message}`);
  }
};

/**
 * Create a new record
 * @param {string} tableName - Table name
 * @param {Object} data - Record data
 * @returns {Promise<Object>} - Created record
 */
export const create = async (tableName, data) => {
  try {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");

    const query = `
      INSERT INTO ${tableName} (${columns.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error creating ${tableName}: ${error.message}`);
  }
};

/**
 * Update a record by ID
 * @param {string} tableName - Table name
 * @param {number} id - Record ID
 * @param {Object} data - Update data
 * @param {string} idColumn - ID column name (default: 'id')
 * @returns {Promise<Object|null>} - Updated record or null
 */
export const update = async (tableName, id, data, idColumn = "id") => {
  try {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(", ");

    const query = `
      UPDATE ${tableName}
      SET ${setClause}
      WHERE ${idColumn} = $${columns.length + 1}
      RETURNING *
    `;

    const result = await pool.query(query, [...values, id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    throw new Error(`Error updating ${tableName}: ${error.message}`);
  }
};

/**
 * Delete a record by ID
 * @param {string} tableName - Table name
 * @param {number} id - Record ID
 * @param {string} idColumn - ID column name (default: 'id')
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
export const deleteRecord = async (tableName, id, idColumn = "id") => {
  try {
    const query = `DELETE FROM ${tableName} WHERE ${idColumn} = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    throw new Error(`Error deleting ${tableName}: ${error.message}`);
  }
};

/**
 * Execute a custom query
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
export const executeQuery = async (query, params = []) => {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    throw new Error(`Error executing query: ${error.message}`);
  }
};

/**
 * Check if record exists
 * @param {string} tableName - Table name
 * @param {Object} conditions - WHERE conditions
 * @returns {Promise<boolean>} - True if exists
 */
export const exists = async (tableName, conditions) => {
  try {
    const whereClauses = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(conditions)) {
      whereClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    const query = `SELECT EXISTS(SELECT 1 FROM ${tableName} WHERE ${whereClauses.join(" AND ")})`;
    const result = await pool.query(query, params);
    return result.rows[0].exists;
  } catch (error) {
    throw new Error(`Error checking existence in ${tableName}: ${error.message}`);
  }
};

/**
 * Count records
 * @param {string} tableName - Table name
 * @param {Object} conditions - WHERE conditions (optional)
 * @returns {Promise<number>} - Count
 */
export const count = async (tableName, conditions = {}) => {
  try {
    let query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const params = [];
    let paramIndex = 1;

    const whereClauses = [];
    for (const [key, value] of Object.entries(conditions)) {
      whereClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    throw new Error(`Error counting ${tableName}: ${error.message}`);
  }
};

