/**
 * CTF Presenter
 * Formats CTF data for client responses
 */

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
    duration: ctf.duration,
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

