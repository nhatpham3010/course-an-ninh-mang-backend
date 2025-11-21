/**
 * User Presenter
 * Formats user data for client responses (removes sensitive fields like password)
 */

/**
 * Present a single user (remove password)
 * @param {Object} user - User object from database
 * @returns {Object} - Formatted user object
 */
export const presentUser = (user) => {
  if (!user) return null;

  const { matkhau, ...userData } = user;
  return userData;
};

/**
 * Present multiple users
 * @param {Array} users - Array of user objects
 * @returns {Array} - Array of formatted user objects
 */
export const presentUsers = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map(presentUser);
};

