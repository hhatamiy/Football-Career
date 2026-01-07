const fs = require('fs').promises;
const path = require('path');
const { generateAllTeams } = require('../game/teamFactory');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists or other error
  }
}

/**
 * Read all teams from storage
 * @returns {Promise<Object>} Object keyed by team ID
 */
async function getAllTeams() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(TEAMS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, generate initial teams
      await initializeTeams();
      const data = await fs.readFile(TEAMS_FILE, 'utf8');
      return JSON.parse(data);
    }
    throw error;
  }
}

/**
 * Initialize teams file with generated teams
 * @returns {Promise<void>}
 */
async function initializeTeams() {
  await ensureDataDir();
  const teams = generateAllTeams();
  const teamsObject = {};
  
  teams.forEach(team => {
    teamsObject[team.id] = team;
  });
  
  const tempFile = `${TEAMS_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(teamsObject, null, 2), 'utf8');
  await fs.rename(tempFile, TEAMS_FILE);
}

/**
 * Get a specific team by ID
 * @param {string} teamId - Team ID
 * @returns {Promise<Object|null>} Team object or null if not found
 */
async function getTeam(teamId) {
  const teams = await getAllTeams();
  return teams[teamId] || null;
}

/**
 * Get all teams in a specific league
 * @param {string} leagueId - League ID
 * @returns {Promise<Array<Object>>} Array of teams
 */
async function getTeamsByLeague(leagueId) {
  const teams = await getAllTeams();
  return Object.values(teams).filter(team => team.league === leagueId);
}

/**
 * Save a team to storage
 * @param {Object} team - Team object with id
 * @returns {Promise<void>}
 */
async function saveTeam(team) {
  await ensureDataDir();
  const teams = await getAllTeams();
  teams[team.id] = team;
  
  // Atomic write: write to temp file first, then rename
  const tempFile = `${TEAMS_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(teams, null, 2), 'utf8');
  await fs.rename(tempFile, TEAMS_FILE);
}

/**
 * Save multiple teams at once
 * @param {Array<Object>} teamsToSave - Array of team objects
 * @returns {Promise<void>}
 */
async function saveTeams(teamsToSave) {
  await ensureDataDir();
  const teams = await getAllTeams();
  
  teamsToSave.forEach(team => {
    teams[team.id] = team;
  });
  
  const tempFile = `${TEAMS_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(teams, null, 2), 'utf8');
  await fs.rename(tempFile, TEAMS_FILE);
}

/**
 * Add a player to a team's squad
 * @param {string} teamId - Team ID
 * @param {string} userId - Player user ID
 * @returns {Promise<void>}
 */
async function addPlayerToTeam(teamId, userId) {
  const team = await getTeam(teamId);
  if (!team) throw new Error('Team not found');
  
  if (!team.squad.includes(userId)) {
    team.squad.push(userId);
    await saveTeam(team);
  }
}

/**
 * Remove a player from a team's squad
 * @param {string} teamId - Team ID
 * @param {string} userId - Player user ID
 * @returns {Promise<void>}
 */
async function removePlayerFromTeam(teamId, userId) {
  const team = await getTeam(teamId);
  if (!team) throw new Error('Team not found');
  
  team.squad = team.squad.filter(id => id !== userId);
  await saveTeam(team);
}

module.exports = {
  getAllTeams,
  getTeam,
  getTeamsByLeague,
  saveTeam,
  saveTeams,
  addPlayerToTeam,
  removePlayerFromTeam,
  initializeTeams
};

