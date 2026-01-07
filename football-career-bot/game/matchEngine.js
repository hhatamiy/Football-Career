const { random, chance } = require('../utils/random');
const TUNING = require('../config/tuning');
const { getPosition } = require('../config/positions');
const { updateOverall } = require('./progressionEngine');
const { MIN_STAT } = require('../config/statRanges');
const { calculateDifficulty, calculateOpponentRating, isHighPressureMatch } = require('./difficultyEngine');

/**
 * Calculate match performance score
 * @param {Object} player - Player object
 * @param {number} difficulty - Difficulty modifier
 * @param {boolean} highPressure - Whether match is high pressure
 * @returns {number} Performance score
 */
function calculatePerformance(player, difficulty, highPressure) {
  let performance = 
    (player.overall * TUNING.MATCH_PERFORMANCE_OVERALL_WEIGHT) +
    (player.form * TUNING.MATCH_PERFORMANCE_FORM_WEIGHT) +
    (player.stamina / TUNING.MATCH_PERFORMANCE_STAMINA_DIVISOR) +
    random(TUNING.MATCH_PERFORMANCE_RANDOM_MIN, TUNING.MATCH_PERFORMANCE_RANDOM_MAX);
  
  // Apply difficulty penalty
  performance -= difficulty * 0.5;
  
  // High pressure affects performance variance
  if (highPressure) {
    const pressureModifier = random(-3, 2); // Can help or hurt
    performance += pressureModifier;
  }
  
  return Math.max(0, performance);
}

/**
 * Calculate match rating (1-10 scale)
 * @param {number} performance - Performance score
 * @param {number} goals - Goals scored
 * @param {number} assists - Assists made
 * @returns {number} Match rating
 */
function calculateRating(performance, goals, assists) {
  let rating = TUNING.RATING_BASE + (performance * TUNING.RATING_PERFORMANCE_MULTIPLIER);
  
  // Bonus for goals and assists
  rating += goals * 0.5;
  rating += assists * 0.3;
  
  // Clamp to 1-10
  rating = Math.max(TUNING.RATING_MIN, Math.min(TUNING.RATING_MAX, rating));
  
  return rating;
}

/**
 * Determine goals scored based on position and performance
 * @param {Object} player - Player object
 * @param {number} performance - Performance score
 * @param {number} difficulty - Difficulty modifier
 * @returns {number} Goals scored
 */
function determineGoals(player, performance, difficulty) {
  const position = getPosition(player.position);
  let goalChance = TUNING.GOAL_BASE_CHANCE * position.goalModifier;
  goalChance += (performance * TUNING.GOAL_PERFORMANCE_MULTIPLIER);
  
  // Difficulty reduces goal chance
  goalChance -= (difficulty * 0.01);
  goalChance = Math.max(0.05, goalChance); // Minimum 5% chance
  
  let goals = 0;
  // Roll for goals (can score 0-3 goals)
  for (let i = 0; i < 3; i++) {
    if (chance(goalChance * 100)) {
      goals++;
    } else {
      break;
    }
  }
  
  return goals;
}

/**
 * Determine assists made based on position and performance
 * @param {Object} player - Player object
 * @param {number} performance - Performance score
 * @param {number} difficulty - Difficulty modifier
 * @returns {number} Assists made
 */
function determineAssists(player, performance, difficulty) {
  const position = getPosition(player.position);
  let assistChance = TUNING.ASSIST_BASE_CHANCE * position.assistModifier;
  assistChance += (performance * TUNING.ASSIST_PERFORMANCE_MULTIPLIER);
  
  // Difficulty reduces assist chance
  assistChance -= (difficulty * 0.008);
  assistChance = Math.max(0.05, assistChance); // Minimum 5% chance
  
  let assists = 0;
  // Roll for assists (can get 0-2 assists)
  for (let i = 0; i < 2; i++) {
    if (chance(assistChance * 100)) {
      assists++;
    } else {
      break;
    }
  }
  
  return assists;
}

/**
 * Update player stats based on match performance
 * @param {Object} player - Player object
 * @param {number} rating - Match rating
 * @param {number} goals - Goals scored
 * @param {number} assists - Assists made
 */
function updateStatsFromMatch(player, rating, goals, assists) {
  // Small stat improvements based on good performance
  if (rating >= 8) {
    // Excellent performance - improve relevant stats
    if (goals > 0) {
      player.stats.shooting = Math.min(99, player.stats.shooting + 1);
    }
    if (assists > 0) {
      player.stats.passing = Math.min(99, player.stats.passing + 1);
    }
  } else if (rating >= 7) {
    // Good performance - small chance of improvement
    if (chance(30)) {
      const stat = ['pace', 'shooting', 'passing', 'defending', 'physical'][random(0, 4)];
      player.stats[stat] = Math.min(99, player.stats[stat] + 1);
    }
  }
  
  updateOverall(player);
}

/**
 * Update form based on match performance
 * @param {Object} player - Player object
 * @param {number} rating - Match rating
 * @param {number} goals - Goals scored
 * @param {number} assists - Assists made
 * @param {boolean} highPressure - Whether match was high pressure
 * @returns {number} Form change
 */
function updateFormFromMatch(player, rating, goals, assists, highPressure) {
  let formChange = -TUNING.MATCH_FORM_BASE_DECREASE;
  
  // Bonus for goals
  formChange += goals * TUNING.FORM_MATCH_BONUS_GOAL;
  
  // Bonus for assists
  formChange += assists * TUNING.FORM_MATCH_BONUS_ASSIST;
  
  // Bonus for high rating
  if (rating > 7) {
    formChange += (rating - 7) * TUNING.FORM_MATCH_BONUS_RATING;
  }
  
  // High pressure matches have bigger form impact
  if (highPressure) {
    if (rating >= 8) {
      formChange += 2; // Big bonus for good performance under pressure
    } else if (rating < 5) {
      formChange -= 2; // Big penalty for poor performance under pressure
    }
  }
  
  player.form = Math.max(
    TUNING.FORM_MIN,
    Math.min(TUNING.FORM_MAX, player.form + formChange)
  );
  
  return formChange;
}

/**
 * Generate injury with severity
 * @param {Object} player - Player object
 * @param {boolean} highPressure - Whether match is high pressure
 * @returns {Object|null} Injury object or null
 */
function generateInjury(player, highPressure) {
  // Higher injury chance under pressure
  let injuryChance = TUNING.MATCH_INJURY_CHANCE;
  if (highPressure) {
    injuryChance *= 1.5;
  }
  
  if (!chance(injuryChance)) return null;
  
  const statNames = ['pace', 'shooting', 'passing', 'defending', 'physical'];
  const injuryStat = statNames[random(0, statNames.length - 1)];
  
  // Determine severity
  const severityRoll = random(1, 100);
  let severity, matchesOut, statDecrease;
  
  if (severityRoll <= TUNING.INJURY_SEVERITY_MINOR_CHANCE) {
    severity = 'minor';
    matchesOut = random(TUNING.INJURY_MINOR_MATCHES.min, TUNING.INJURY_MINOR_MATCHES.max);
    statDecrease = random(1, 2);
  } else if (severityRoll <= TUNING.INJURY_SEVERITY_MINOR_CHANCE + TUNING.INJURY_SEVERITY_MODERATE_CHANCE) {
    severity = 'moderate';
    matchesOut = random(TUNING.INJURY_MODERATE_MATCHES.min, TUNING.INJURY_MODERATE_MATCHES.max);
    statDecrease = random(3, 5);
  } else {
    severity = 'severe';
    matchesOut = random(TUNING.INJURY_SEVERE_MATCHES.min, TUNING.INJURY_SEVERE_MATCHES.max);
    statDecrease = random(6, 10);
  }
  
  player.stats[injuryStat] = Math.max(
    MIN_STAT,
    player.stats[injuryStat] - statDecrease
  );
  
  player.form -= (severity === 'severe' ? 5 : severity === 'moderate' ? 3 : 2);
  player.form = Math.max(TUNING.FORM_MIN, player.form);
  
  player.injury = {
    severity: severity,
    matchesRemaining: matchesOut,
    stat: injuryStat,
    statDecrease: statDecrease
  };
  
  return {
    severity: severity,
    matchesOut: matchesOut,
    stat: injuryStat,
    statDecrease: statDecrease,
    message: `${severity.charAt(0).toUpperCase() + severity.slice(1)} injury! ${injuryStat} decreased by ${statDecrease}. Out for ${matchesOut} matches.`
  };
}

/**
 * Update team standings after match
 * @param {Object} team - Team object
 * @param {number} playerGoals - Goals scored by player
 * @param {number} playerAssists - Assists by player
 * @param {number} playerRating - Player match rating
 * @returns {Promise<void>}
 */
async function updateStandings(team, playerGoals, playerAssists, playerRating) {
  if (!team || !team.standings) return;
  
  // Simulate match result based on player performance
  // Better performance = more likely to win
  let winChance = 0.3; // Base 30% win chance
  if (playerRating >= 8) winChance = 0.7;
  else if (playerRating >= 7) winChance = 0.5;
  else if (playerRating >= 6) winChance = 0.4;
  else if (playerRating < 5) winChance = 0.2;
  
  const resultRoll = Math.random();
  let goalsFor = playerGoals + random(0, 2); // Team goals
  let goalsAgainst = random(0, 2);
  
  if (resultRoll < winChance) {
    // Win
    team.standings.wins += 1;
    team.standings.points += 3;
    goalsFor = Math.max(goalsFor, goalsAgainst + 1);
  } else if (resultRoll < winChance + 0.3) {
    // Draw
    team.standings.draws += 1;
    team.standings.points += 1;
    goalsAgainst = goalsFor;
  } else {
    // Loss
    team.standings.losses += 1;
    goalsAgainst = Math.max(goalsAgainst, goalsFor + 1);
  }
  
  team.standings.goalsFor += goalsFor;
  team.standings.goalsAgainst += goalsAgainst;
  team.standings.matchesPlayed += 1;
  
  const { saveTeam } = require('../utils/teamStore');
  await saveTeam(team);
}

/**
 * Simulate a match
 * @param {Object} player - Player object
 * @returns {Promise<Object>} Match results
 */
async function playMatch(player) {
  const results = {
    performance: 0,
    goals: 0,
    assists: 0,
    rating: 0,
    formChange: 0,
    injury: null,
    highPressure: false,
    opponentRating: 0
  };
  
  // Check for active injury
  if (player.injury && player.injury.matchesRemaining > 0) {
    player.injury.matchesRemaining -= 1;
    if (player.injury.matchesRemaining === 0) {
      player.injury = null;
    } else {
      return {
        ...results,
        injury: {
          message: `You are still injured! ${player.injury.matchesRemaining} matches remaining.`
        }
      };
    }
  }
  
  // Calculate difficulty
  const difficulty = await calculateDifficulty(player);
  results.opponentRating = calculateOpponentRating(player, difficulty);
  
  // Check if high pressure match
  const { getTeam } = require('../utils/teamStore');
  let team = null;
  if (player.currentTeam) {
    team = await getTeam(player.currentTeam);
    results.highPressure = team ? await isHighPressureMatch(player, team) : false;
  }
  
  // Calculate performance
  results.performance = calculatePerformance(player, difficulty, results.highPressure);
  
  // Determine goals and assists
  results.goals = determineGoals(player, results.performance, difficulty);
  results.assists = determineAssists(player, results.performance, difficulty);
  
  // Calculate rating
  results.rating = calculateRating(results.performance, results.goals, results.assists);
  
  // Update player stats
  updateStatsFromMatch(player, results.rating, results.goals, results.assists);
  
  // Update form
  results.formChange = updateFormFromMatch(player, results.rating, results.goals, results.assists, results.highPressure);
  
  // Update career stats
  player.matchesPlayed += 1;
  player.goals += results.goals;
  player.assists += results.assists;
  
  // Track big game performances
  if (results.highPressure && results.rating >= 8) {
    if (!player.careerStats) player.careerStats = { bigGamePerformances: 0, trophies: [] };
    player.careerStats.bigGamePerformances += 1;
  }
  
  // Update season tracking
  if (!player.season) {
    player.season = { number: 1, matchesPlayed: 0 };
  }
  player.season.matchesPlayed += 1;
  
  // Update team standings
  if (team) {
    await updateStandings(team, results.goals, results.assists, results.rating);
  }
  
  // Reduce stamina
  const staminaDecrease = random(
    TUNING.MATCH_STAMINA_DECREASE_MIN,
    TUNING.MATCH_STAMINA_DECREASE_MAX
  );
  player.stamina = Math.max(
    TUNING.STAMINA_MIN,
    player.stamina - staminaDecrease
  );
  
  // Check for injury
  const injury = generateInjury(player, results.highPressure);
  if (injury) {
    results.injury = injury;
    results.formChange -= (injury.severity === 'severe' ? 5 : injury.severity === 'moderate' ? 3 : 2);
  }
  
  return results;
}

module.exports = {
  playMatch
};

