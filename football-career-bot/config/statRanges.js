/**
 * Stat ranges for each position
 * Used for initial player generation
 */

const STAT_RANGES = {
  ST: {
    pace: { min: 60, max: 75 },
    shooting: { min: 55, max: 70 },
    passing: { min: 45, max: 60 },
    defending: { min: 20, max: 35 },
    physical: { min: 50, max: 65 }
  },
  CAM: {
    pace: { min: 55, max: 70 },
    shooting: { min: 50, max: 65 },
    passing: { min: 60, max: 75 },
    defending: { min: 25, max: 40 },
    physical: { min: 45, max: 60 }
  },
  CM: {
    pace: { min: 50, max: 65 },
    shooting: { min: 45, max: 60 },
    passing: { min: 55, max: 70 },
    defending: { min: 40, max: 55 },
    physical: { min: 50, max: 65 }
  },
  CDM: {
    pace: { min: 45, max: 60 },
    shooting: { min: 35, max: 50 },
    passing: { min: 50, max: 65 },
    defending: { min: 55, max: 70 },
    physical: { min: 55, max: 70 }
  },
  CB: {
    pace: { min: 40, max: 55 },
    shooting: { min: 25, max: 40 },
    passing: { min: 45, max: 60 },
    defending: { min: 60, max: 75 },
    physical: { min: 60, max: 75 }
  },
  LB: {
    pace: { min: 55, max: 70 },
    shooting: { min: 35, max: 50 },
    passing: { min: 50, max: 65 },
    defending: { min: 50, max: 65 },
    physical: { min: 50, max: 65 }
  },
  RB: {
    pace: { min: 55, max: 70 },
    shooting: { min: 35, max: 50 },
    passing: { min: 50, max: 65 },
    defending: { min: 50, max: 65 },
    physical: { min: 50, max: 65 }
  },
  GK: {
    pace: { min: 30, max: 45 },
    shooting: { min: 15, max: 30 },
    passing: { min: 40, max: 55 },
    defending: { min: 45, max: 60 },
    physical: { min: 70, max: 85 }
  }
};

/**
 * Maximum stat value (cap)
 */
const MAX_STAT = 99;

/**
 * Minimum stat value
 */
const MIN_STAT = 1;

/**
 * Get stat ranges for a position
 * @param {string} position - Position code
 * @returns {Object} Stat ranges object
 */
function getStatRanges(position) {
  return STAT_RANGES[position] || STAT_RANGES.ST;
}

module.exports = {
  STAT_RANGES,
  MAX_STAT,
  MIN_STAT,
  getStatRanges
};

