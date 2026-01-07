const TUNING = require('../config/tuning');
const { MAX_STAT, MIN_STAT } = require('../config/statRanges');
const { getTeam } = require('../utils/teamStore');
const { getLeague } = require('../config/leagues');

/**
 * Check if player age should increase based on matches played
 * @param {Object} player - Player object
 * @returns {boolean} True if age should increase
 */
function shouldAgeIncrease(player) {
  return player.matchesPlayed > 0 && 
         player.matchesPlayed % TUNING.MATCHES_PER_AGE_INCREASE === 0;
}

/**
 * Update player age
 * @param {Object} player - Player object
 * @returns {Object} Updated player
 */
function updateAge(player) {
  if (shouldAgeIncrease(player)) {
    player.age += 1;
    applyAging(player);
  }
  return player;
}

/**
 * Apply aging effects to player stats
 * Physical stats decline after age 30
 * @param {Object} player - Player object
 * @returns {Object} Updated player
 */
function applyAging(player) {
  if (player.age >= TUNING.AGING_START_AGE) {
    const yearsOver30 = player.age - TUNING.AGING_START_AGE;
    const decrease = yearsOver30 * TUNING.AGING_PHYSICAL_DECREASE_PER_YEAR;
    
    // Apply decrease to physical stat, but don't go below minimum
    player.stats.physical = Math.max(
      MIN_STAT,
      player.stats.physical - TUNING.AGING_PHYSICAL_DECREASE_PER_YEAR
    );
  }
  return player;
}

/**
 * Check and enforce potential cap on stats
 * Stats cannot exceed potential
 * @param {Object} player - Player object
 * @returns {Object} Updated player
 */
function checkPotential(player) {
  const stats = ['pace', 'shooting', 'passing', 'defending', 'physical'];
  
  stats.forEach(stat => {
    if (player.stats[stat] > player.potential) {
      player.stats[stat] = player.potential;
    }
    // Also enforce max stat cap
    if (player.stats[stat] > MAX_STAT) {
      player.stats[stat] = MAX_STAT;
    }
  });
  
  return player;
}

/**
 * Calculate overall rating from stats
 * @param {Object} player - Player object
 * @returns {number} Overall rating
 */
function calculateOverall(player) {
  const { getPosition } = require('../config/positions');
  const position = getPosition(player.position);
  const weights = position.statWeights;
  
  let overall = 0;
  overall += player.stats.pace * weights.pace;
  overall += player.stats.shooting * weights.shooting;
  overall += player.stats.passing * weights.passing;
  overall += player.stats.defending * weights.defending;
  overall += player.stats.physical * weights.physical;
  
  return Math.round(overall);
}

/**
 * Update player overall rating
 * @param {Object} player - Player object
 * @returns {Object} Updated player
 */
function updateOverall(player) {
  player.overall = calculateOverall(player);
  return player;
}

/**
 * Apply form decay based on league tier
 * @param {Object} player - Player object
 * @returns {Promise<Object>} Updated player
 */
async function applyFormDecay(player) {
  if (!player.currentTeam) return player;
  
  const team = await getTeam(player.currentTeam);
  if (!team) return player;
  
  const league = getLeague(team.league);
  const decayRate = TUNING.FORM_DECAY_RATE_BASE + (league.tier * TUNING.FORM_DECAY_RATE_TIER_MULTIPLIER);
  
  // Form decays slightly each match
  player.form = Math.max(
    TUNING.FORM_MIN,
    player.form - decayRate
  );
  
  return player;
}

/**
 * Get training effectiveness modifier based on age
 * @param {Object} player - Player object
 * @returns {number} Effectiveness multiplier (0-1)
 */
function getTrainingEffectiveness(player) {
  if (player.age < 25) return 1.0;
  if (player.age < 30) return 0.9;
  if (player.age < 35) return 0.7;
  return 0.5; // Much harder to improve when older
}

/**
 * Get stamina cost modifier based on age
 * @param {Object} player - Player object
 * @returns {number} Stamina cost multiplier
 */
function getStaminaCostModifier(player) {
  if (player.age < 25) return 1.0;
  if (player.age < 30) return 1.1;
  if (player.age < 35) return 1.2;
  return 1.4; // Older players get more tired
}

module.exports = {
  updateAge,
  applyAging,
  checkPotential,
  calculateOverall,
  updateOverall,
  applyFormDecay,
  getTrainingEffectiveness,
  getStaminaCostModifier
};

