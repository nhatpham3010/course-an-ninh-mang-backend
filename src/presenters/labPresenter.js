/**
 * Lab Presenter
 * Formats lab data for client responses
 */

/**
 * Present a single lab
 * @param {Object} lab - Lab object from database
 * @returns {Object} - Formatted lab object
 */
export const presentLab = (lab) => {
  if (!lab) return null;

  return {
    id: lab.id,
    title: lab.ten,
    type: lab.loai,
    description: lab.mota,
    pdfUrl: lab.pdf_url,
  };
};

/**
 * Present multiple labs
 * @param {Array} labs - Array of lab objects
 * @returns {Array} - Array of formatted lab objects
 */
export const presentLabs = (labs) => {
  if (!Array.isArray(labs)) return [];
  return labs.map(presentLab);
};

