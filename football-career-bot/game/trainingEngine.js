const { random, chance } = require('../utils/random');
const TUNING = require('../config/tuning');
const { MAX_STAT, MIN_STAT } = require('../config/statRanges');
const { checkPotential, updateOverall, getTrainingEffectiveness, getStaminaCostModifier } = require('./progressionEngine');

/**
 * Execute training action
 * @param {Object} player - Player object
 * @returns {Object} Training results
 */
function train(player) {
  const results = {
    statChanges: [],
    formChange: 0,
    injury: null
  };
  
  // Select 1-2 random stats to improve
  const statsToImprove = random(
    TUNING.TRAINING_STATS_TO_IMPROVE_MIN,
    TUNING.TRAINING_STATS_TO_IMPROVE_MAX
  );
  
  const statNames = ['pace', 'shooting', 'passing', 'defending', 'physical'];
  const selectedStats = [];
  
  // Randomly select stats without duplicates
  while (selectedStats.length < statsToImprove && selectedStats.length < statNames.length) {
    const stat = statNames[random(0, statNames.length - 1)];
    if (!selectedStats.includes(stat)) {
      selectedStats.push(stat);
    }
  }
  
  // Get training effectiveness based on age
  const effectiveness = getTrainingEffectiveness(player);
  
  // Improve selected stats
  selectedStats.forEach(stat => {
    const oldValue = player.stats[stat];
    let increase = random(
      TUNING.TRAINING_STAT_INCREASE_MIN,
      TUNING.TRAINING_STAT_INCREASE_MAX
    );
    
    // Apply age-based effectiveness
    increase = Math.floor(increase * effectiveness);
    if (increase < 1 && chance(effectiveness * 100)) {
      increase = 1; // Small chance to still improve
    }
    
    const newValue = Math.min(MAX_STAT, oldValue + increase);
    
    if (newValue > oldValue) {
      player.stats[stat] = newValue;
      
      results.statChanges.push({
        stat,
        oldValue,
        newValue
      });
    }
  });
  
  // Apply potential cap
  checkPotential(player);
  
  // Update overall
  updateOverall(player);
  
  // Reduce stamina (more for older players)
  const staminaCostModifier = getStaminaCostModifier(player);
  const baseStaminaDecrease = random(
    TUNING.TRAINING_STAMINA_DECREASE_MIN,
    TUNING.TRAINING_STAMINA_DECREASE_MAX
  );
  const staminaDecrease = Math.ceil(baseStaminaDecrease * staminaCostModifier);
  
  player.stamina = Math.max(
    TUNING.STAMINA_MIN,
    player.stamina - staminaDecrease
  );
  
  // Improve form
  const formIncrease = random(
    TUNING.TRAINING_FORM_INCREASE_MIN,
    TUNING.TRAINING_FORM_INCREASE_MAX
  );
  player.form = Math.min(
    TUNING.FORM_MAX,
    player.form + formIncrease
  );
  results.formChange = formIncrease;
  
  // Check for injury
  if (chance(TUNING.TRAINING_INJURY_CHANCE)) {
    const injuryStat = statNames[random(0, statNames.length - 1)];
    const injuryDecrease = random(1, 3);
    player.stats[injuryStat] = Math.max(
      MIN_STAT,
      player.stats[injuryStat] - injuryDecrease
    );
    player.form -= 2;
    player.form = Math.max(TUNING.FORM_MIN, player.form);
    results.injury = `Minor injury! ${injuryStat} decreased by ${injuryDecrease}. Form decreased.`;
    results.formChange -= 2;
  }
  
  return results;
}

module.exports = {
  train
};

