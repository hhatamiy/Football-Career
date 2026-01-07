/**
 * Position definitions and stat weights for match performance
 */

const POSITIONS = {
  ST: {
    name: 'Striker',
    statWeights: {
      pace: 0.25,
      shooting: 0.35,
      passing: 0.15,
      defending: 0.05,
      physical: 0.20
    },
    goalModifier: 1.5,
    assistModifier: 0.8
  },
  CAM: {
    name: 'Attacking Midfielder',
    statWeights: {
      pace: 0.20,
      shooting: 0.25,
      passing: 0.30,
      defending: 0.10,
      physical: 0.15
    },
    goalModifier: 1.2,
    assistModifier: 1.3
  },
  CM: {
    name: 'Central Midfielder',
    statWeights: {
      pace: 0.15,
      shooting: 0.15,
      passing: 0.30,
      defending: 0.20,
      physical: 0.20
    },
    goalModifier: 0.9,
    assistModifier: 1.1
  },
  CDM: {
    name: 'Defensive Midfielder',
    statWeights: {
      pace: 0.15,
      shooting: 0.10,
      passing: 0.25,
      defending: 0.30,
      physical: 0.20
    },
    goalModifier: 0.5,
    assistModifier: 0.9
  },
  CB: {
    name: 'Centre Back',
    statWeights: {
      pace: 0.15,
      shooting: 0.05,
      passing: 0.20,
      defending: 0.40,
      physical: 0.20
    },
    goalModifier: 0.2,
    assistModifier: 0.5
  },
  LB: {
    name: 'Left Back',
    statWeights: {
      pace: 0.25,
      shooting: 0.10,
      passing: 0.25,
      defending: 0.25,
      physical: 0.15
    },
    goalModifier: 0.3,
    assistModifier: 0.7
  },
  RB: {
    name: 'Right Back',
    statWeights: {
      pace: 0.25,
      shooting: 0.10,
      passing: 0.25,
      defending: 0.25,
      physical: 0.15
    },
    goalModifier: 0.3,
    assistModifier: 0.7
  },
  GK: {
    name: 'Goalkeeper',
    statWeights: {
      pace: 0.10,
      shooting: 0.05,
      passing: 0.20,
      defending: 0.15,
      physical: 0.50
    },
    goalModifier: 0.0,
    assistModifier: 0.3
  }
};

/**
 * Get position configuration
 * @param {string} position - Position code
 * @returns {Object} Position config
 */
function getPosition(position) {
  return POSITIONS[position] || POSITIONS.ST;
}

/**
 * Get all available positions
 * @returns {Array<string>} Array of position codes
 */
function getAllPositions() {
  return Object.keys(POSITIONS);
}

module.exports = {
  POSITIONS,
  getPosition,
  getAllPositions
};

