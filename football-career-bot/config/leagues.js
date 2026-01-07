/**
 * League definitions and tier structure
 */

const LEAGUES = {
  LEAGUE_3: {
    id: 'LEAGUE_3',
    name: 'League 3',
    tier: 1,
    teamsPerLeague: 20,
    promotionSpots: 3,
    relegationSpots: 3
  },
  LEAGUE_2: {
    id: 'LEAGUE_2',
    name: 'League 2',
    tier: 2,
    teamsPerLeague: 20,
    promotionSpots: 3,
    relegationSpots: 3
  },
  LEAGUE_1: {
    id: 'LEAGUE_1',
    name: 'League 1',
    tier: 3,
    teamsPerLeague: 20,
    promotionSpots: 3,
    relegationSpots: 3
  },
  PREMIER_LEAGUE: {
    id: 'PREMIER_LEAGUE',
    name: 'Premier League',
    tier: 4,
    teamsPerLeague: 20,
    promotionSpots: 0,
    relegationSpots: 3
  }
};

/**
 * Get league configuration
 * @param {string} leagueId - League ID
 * @returns {Object} League config
 */
function getLeague(leagueId) {
  return LEAGUES[leagueId] || LEAGUES.LEAGUE_3;
}

/**
 * Get all leagues
 * @returns {Array<Object>} Array of league configs
 */
function getAllLeagues() {
  return Object.values(LEAGUES);
}

/**
 * Get league by tier
 * @param {number} tier - League tier (1-4)
 * @returns {Object} League config
 */
function getLeagueByTier(tier) {
  return Object.values(LEAGUES).find(league => league.tier === tier) || LEAGUES.LEAGUE_3;
}

/**
 * Get next league up (for promotion)
 * @param {string} leagueId - Current league ID
 * @returns {Object|null} Next league or null if at top
 */
function getNextLeague(leagueId) {
  const current = getLeague(leagueId);
  if (current.tier >= 4) return null;
  return getLeagueByTier(current.tier + 1);
}

/**
 * Get previous league down (for relegation)
 * @param {string} leagueId - Current league ID
 * @returns {Object|null} Previous league or null if at bottom
 */
function getPreviousLeague(leagueId) {
  const current = getLeague(leagueId);
  if (current.tier <= 1) return null;
  return getLeagueByTier(current.tier - 1);
}

module.exports = {
  LEAGUES,
  getLeague,
  getAllLeagues,
  getLeagueByTier,
  getNextLeague,
  getPreviousLeague
};

