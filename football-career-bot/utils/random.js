/**
 * Random utility functions for controlled randomness
 */

/**
 * Generate a random integer between min (inclusive) and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min (inclusive) and max (exclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float
 */
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Return true based on percentage chance
 * @param {number} percentage - Chance percentage (0-100)
 * @returns {boolean} True if chance succeeds
 */
function chance(percentage) {
  return Math.random() * 100 < percentage;
}

module.exports = {
  random,
  randomFloat,
  chance
};

