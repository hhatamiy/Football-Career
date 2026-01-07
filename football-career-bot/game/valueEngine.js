const TUNING = require('../config/tuning');

/**
 * Calculate market value based on player attributes
 * Formula: (overall + potential) × ageModifier × formModifier
 * @param {Object} player - Player object
 * @returns {number} Market value in millions
 */
function calculateMarketValue(player) {
  const baseValue = (player.overall + player.potential) * TUNING.VALUE_BASE_MULTIPLIER;
  
  // Age modifier: peak at 28, decline after
  let ageModifier = 1.0;
  if (player.age > TUNING.VALUE_AGE_PEAK) {
    const yearsOverPeak = player.age - TUNING.VALUE_AGE_PEAK;
    ageModifier = Math.max(0.5, 1.0 - (yearsOverPeak * TUNING.VALUE_AGE_DECLINE_RATE));
  } else if (player.age < 22) {
    // Young players have slightly lower value (less proven)
    ageModifier = 0.9;
  }
  
  // Form modifier: positive form increases value
  const formModifier = 1.0 + (player.form * TUNING.VALUE_FORM_MULTIPLIER);
  
  const value = baseValue * ageModifier * formModifier;
  
  // Ensure minimum value
  return Math.max(0.5, value);
}

/**
 * Update player market value
 * @param {Object} player - Player object
 * @returns {Object} Updated player
 */
function updateMarketValue(player) {
  player.marketValue = calculateMarketValue(player);
  return player;
}

module.exports = {
  calculateMarketValue,
  updateMarketValue
};

