const { getTeam } = require('../utils/teamStore');
const { getLeague } = require('../config/leagues');
const TUNING = require('../config/tuning');

/**
 * Calculate career stage (early/mid/late)
 * @param {Object} player - Player object
 * @returns {string} Career stage
 */
function getCareerStage(player) {
  if (player.age < 22) return 'early';
  if (player.age < 28) return 'mid';
  return 'late';
}

/**
 * Calculate match difficulty based on player and context
 * @param {Object} player - Player object
 * @returns {Promise<number>} Difficulty modifier
 */
async function calculateDifficulty(player) {
  let difficulty = TUNING.DIFFICULTY_BASE;
  
  // Base difficulty from overall rating
  difficulty += player.overall * TUNING.DIFFICULTY_OVERALL_MULTIPLIER;
  
  // League tier difficulty
  if (player.currentTeam) {
    const team = await getTeam(player.currentTeam);
    if (team) {
      const league = getLeague(team.league);
      difficulty += league.tier * TUNING.DIFFICULTY_TIER_MULTIPLIER;
    }
  }
  
  // Career stage difficulty
  const careerStage = getCareerStage(player);
  if (careerStage === 'mid') {
    difficulty += TUNING.DIFFICULTY_CAREER_STAGE_MULTIPLIER;
  } else if (careerStage === 'late') {
    difficulty += TUNING.DIFFICULTY_CAREER_STAGE_MULTIPLIER * 1.5;
  }
  
  return Math.max(0, difficulty);
}

/**
 * Calculate opponent rating based on difficulty
 * @param {Object} player - Player object
 * @param {number} difficulty - Difficulty modifier
 * @returns {number} Opponent rating
 */
function calculateOpponentRating(player, difficulty) {
  const baseRating = player.overall;
  const opponentRating = baseRating + difficulty;
  
  // Clamp between reasonable bounds
  return Math.max(50, Math.min(99, Math.round(opponentRating)));
}

/**
 * Check if match is high pressure
 * @param {Object} player - Player object
 * @param {Object} team - Player's team
 * @returns {Promise<boolean>} True if high pressure match
 */
async function isHighPressureMatch(player, team) {
  if (!team || !team.standings) return false;
  
  const league = getLeague(team.league);
  
  // End of season (always high pressure)
  if (player.season && player.season.matchesPlayed >= TUNING.SEASON_LENGTH - 3) return true;
  
  // Get all teams to calculate position
  const { getTeamsByLeague } = require('../utils/teamStore');
  const allTeams = await getTeamsByLeague(team.league);
  const position = getTeamPosition(team, allTeams);
  
  // Promotion/relegation battles
  if (league.promotionSpots > 0 && position <= league.promotionSpots + 2) return true;
  if (league.relegationSpots > 0 && position > allTeams.length - league.relegationSpots - 2) return true;
  
  return false;
}

/**
 * Get team position in league (simplified - would need all teams)
 * @param {Object} team - Team object
 * @param {Array<Object>} allTeams - All teams in league
 * @returns {number} Position (1-based)
 */
function getTeamPosition(team, allTeams) {
  const sorted = [...allTeams].sort((a, b) => {
    if (b.standings.points !== a.standings.points) {
      return b.standings.points - a.standings.points;
    }
    const gdA = a.standings.goalsFor - a.standings.goalsAgainst;
    const gdB = b.standings.goalsFor - b.standings.goalsAgainst;
    return gdB - gdA;
  });
  
  return sorted.findIndex(t => t.id === team.id) + 1;
}

module.exports = {
  calculateDifficulty,
  calculateOpponentRating,
  isHighPressureMatch,
  getCareerStage
};

