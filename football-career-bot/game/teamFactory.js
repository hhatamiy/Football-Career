const { random } = require('../utils/random');
const { getAllLeagues } = require('../config/leagues');

/**
 * Team name templates for generating realistic team names
 */
const TEAM_NAME_TEMPLATES = [
  // City + FC/United/City
  ['Manchester', 'Liverpool', 'London', 'Birmingham', 'Leeds', 'Sheffield', 'Bristol', 'Newcastle', 'Leicester', 'Nottingham', 'Derby', 'Southampton', 'Portsmouth', 'Brighton', 'Norwich', 'Cardiff', 'Swansea', 'Reading', 'Watford', 'Burnley'],
  ['United', 'City', 'FC', 'Wanderers', 'Athletic', 'Rovers', 'Town', 'Albion', 'Rangers']
];

/**
 * Generate a random team name
 * @returns {string} Team name
 */
function generateTeamName() {
  const cities = TEAM_NAME_TEMPLATES[0];
  const suffixes = TEAM_NAME_TEMPLATES[1];
  
  const city = cities[random(0, cities.length - 1)];
  const suffix = suffixes[random(0, suffixes.length - 1)];
  
  return `${city} ${suffix}`;
}

/**
 * Generate team rating based on league tier
 * @param {number} tier - League tier (1-4)
 * @returns {number} Team rating (50-95)
 */
function generateTeamRating(tier) {
  // Higher tier = higher rating
  const baseMin = 50 + (tier - 1) * 10;
  const baseMax = 65 + (tier - 1) * 10;
  
  // Add some variance
  const min = baseMin;
  const max = Math.min(95, baseMax + 5);
  
  return random(min, max);
}

/**
 * Generate facilities level (1-5)
 * @param {number} rating - Team rating
 * @returns {number} Facilities level
 */
function generateFacilities(rating) {
  // Better teams have better facilities
  if (rating >= 85) return 5;
  if (rating >= 75) return 4;
  if (rating >= 65) return 3;
  if (rating >= 55) return 2;
  return 1;
}

/**
 * Generate team budget (in millions)
 * @param {number} rating - Team rating
 * @param {number} tier - League tier
 * @returns {number} Budget in millions
 */
function generateBudget(rating, tier) {
  const baseBudget = rating * 0.5 + (tier * 5);
  const variance = random(-10, 20);
  return Math.max(5, baseBudget + variance);
}

/**
 * Create a new team
 * @param {string} leagueId - League ID
 * @param {number} teamNumber - Team number in league (for unique IDs)
 * @returns {Object} Team object
 */
function createTeam(leagueId, teamNumber) {
  const league = require('../config/leagues').getLeague(leagueId);
  const rating = generateTeamRating(league.tier);
  const facilities = generateFacilities(rating);
  const budget = generateBudget(rating, league.tier);
  
  return {
    id: `${leagueId}_${teamNumber}`,
    name: generateTeamName(),
    league: leagueId,
    rating: rating,
    facilities: facilities,
    budget: budget,
    squad: [],
    standings: {
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      matchesPlayed: 0
    }
  };
}

/**
 * Generate all teams for all leagues
 * @returns {Array<Object>} Array of all teams
 */
function generateAllTeams() {
  const leagues = getAllLeagues();
  const allTeams = [];
  
  leagues.forEach(league => {
    for (let i = 1; i <= league.teamsPerLeague; i++) {
      const team = createTeam(league.id, i);
      allTeams.push(team);
    }
  });
  
  return allTeams;
}

/**
 * Get a random team from a specific league
 * @param {string} leagueId - League ID
 * @param {Array<Object>} allTeams - All teams array
 * @returns {Object|null} Random team or null
 */
function getRandomTeamFromLeague(leagueId, allTeams) {
  const teamsInLeague = allTeams.filter(team => team.league === leagueId);
  if (teamsInLeague.length === 0) return null;
  return teamsInLeague[random(0, teamsInLeague.length - 1)];
}

/**
 * Get a team suitable for a starting player (lowest tier, lower rating)
 * @param {Array<Object>} allTeams - All teams array
 * @returns {Object|null} Suitable starting team
 */
function getStartingTeam(allTeams) {
  // Get teams from lowest league (LEAGUE_3)
  const league3Teams = allTeams.filter(team => team.league === 'LEAGUE_3');
  if (league3Teams.length === 0) return null;
  
  // Sort by rating and pick from bottom half
  const sorted = league3Teams.sort((a, b) => a.rating - b.rating);
  const bottomHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  
  return bottomHalf[random(0, bottomHalf.length - 1)];
}

module.exports = {
  createTeam,
  generateAllTeams,
  getRandomTeamFromLeague,
  getStartingTeam,
  generateTeamName,
  generateTeamRating
};

