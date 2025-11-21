/**
 * CTF Presenter
 * Formats CTF data for client responses
 */

/**
 * Format PostgreSQL INTERVAL to string
 * @param {any} interval - INTERVAL from database (can be object, string, or null)
 * @returns {string} - Formatted duration string (e.g., "15 minutes")
 */
const formatInterval = (interval) => {
  if (!interval) return null;
  
  // If it's already a string, return as is
  if (typeof interval === "string") {
    return interval;
  }
  
  // If it's an object (PostgreSQL INTERVAL serialized as object)
  if (typeof interval === "object") {
    const { years, months, days, hours, minutes, seconds } = interval;
    
    // Build duration string from components
    const parts = [];
    if (years) parts.push(`${years} year${years > 1 ? "s" : ""}`);
    if (months) parts.push(`${months} month${months > 1 ? "s" : ""}`);
    if (days) parts.push(`${days} day${days > 1 ? "s" : ""}`);
    if (hours) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
    if (seconds) parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);
    
    return parts.length > 0 ? parts.join(" ") : null;
  }
  
  return null;
};

/**
 * Present a single CTF
 * @param {Object} ctf - CTF object from database
 * @returns {Object} - Formatted CTF object
 */
export const presentCTF = (ctf) => {
  if (!ctf) return null;

  return {
    id: ctf.id,
    title: ctf.ten,
    description: ctf.mota,
    category: ctf.loaictf,
    author: ctf.tacgia,
    difficulty: ctf.choai,
    points: ctf.points,
    duration: formatInterval(ctf.duration),
    pdfUrl: ctf.pdf_url,
    status: ctf.status || "available",
    hasSubmitted: ctf.hasSubmitted || false,
    submittedAnswer: ctf.submittedAnswer || null,
    submittedFile: ctf.submittedFile || null,
  };
};

/**
 * Present multiple CTFs
 * @param {Array} ctfs - Array of CTF objects
 * @returns {Array} - Array of formatted CTF objects
 */
export const presentCTFs = (ctfs) => {
  if (!Array.isArray(ctfs)) return [];
  return ctfs.map(presentCTF);
};

