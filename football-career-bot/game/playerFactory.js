const { random } = require('../utils/random');
const { getStatRanges } = require('../config/statRanges');
const { calculateOverall } = require('./progressionEngine');
const { getAllTeams } = require('../utils/teamStore');
const { getStartingTeam } = require('./teamFactory');

/**
 * Generate random stats for a position
 * @param {string} position - Position code
 * @returns {Object} Stats object
 */
function generateStats(position) {
  const ranges = getStatRanges(position);
  const stats = {};
  
  Object.keys(ranges).forEach(stat => {
    stats[stat] = random(ranges[stat].min, ranges[stat].max);
  });
  
  return stats;
}

/**
 * Generate random potential (65-90 range)
 * @returns {number} Potential value
 */
function generatePotential() {
  return random(65, 90);
}

/**
 * Generate initial contract
 * @param {string} teamId - Team ID
 * @param {number} playerOverall - Player overall rating
 * @returns {Object} Contract object
 */
function generateContract(teamId, playerOverall) {
  const contractLength = random(2, 4); // 2-4 years
  const baseSalary = playerOverall * 0.05; // Base salary based on overall
  const salary = Math.max(0.1, baseSalary + random(-0.05, 0.1));
  const releaseClause = playerOverall * 2; // Release clause based on overall
  
  return {
    teamId: teamId,
    salary: parseFloat(salary.toFixed(2)),
    length: contractLength,
    startDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + contractLength * 365 * 24 * 60 * 60 * 1000).toISOString(),
    releaseClause: parseFloat(releaseClause.toFixed(2))
  };
}

/**
 * Create a new player
 * @param {string} userId - Discord user ID
 * @param {string} name - Player name
 * @param {string} position - Position code
 * @returns {Promise<Object>} Player object
 */
async function createPlayer(userId, name, position) {
  const stats = generateStats(position);
  const potential = generatePotential();
  const overall = calculateOverall({
    position,
    stats
  });
  
  // Get starting team
  const allTeams = await getAllTeams();
  const teamsArray = Object.values(allTeams);
  const startingTeam = getStartingTeam(teamsArray);
  
  // Generate contract
  const contract = generateContract(startingTeam.id, overall);
  
  // Add player to team squad
  const { addPlayerToTeam } = require('../utils/teamStore');
  await addPlayerToTeam(startingTeam.id, userId);
  
  return {
    userId,
    name,
    position,
    age: 18,
    overall,
    potential,
    stats,
    form: 0,
    stamina: 100,
    marketValue: 5,
    matchesPlayed: 0,
    goals: 0,
    assists: 0,
    currentTeam: startingTeam.id,
    contract: contract,
    pendingOffers: [],
    season: {
      number: 1,
      matchesPlayed: 0
    },
    injury: null,
    careerStats: {
      bigGamePerformances: 0,
      trophies: []
    }
  };
}

module.exports = {
  createPlayer,
  generateContract
};

