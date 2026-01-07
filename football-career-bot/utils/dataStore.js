const fs = require('fs').promises;
const path = require('path');
const { random } = require('./random');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');

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
 * Read all players from storage
 * @returns {Promise<Object>} Object keyed by userId
 */
async function getAllPlayers() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(PLAYERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty object
      return {};
    }
    throw error;
  }
}

/**
 * Migrate existing player to new structure
 * @param {Object} player - Player object
 * @returns {Promise<Object>} Migrated player
 */
async function migratePlayer(player) {
  let needsSave = false;
  
  // Assign team if missing
  if (!player.currentTeam) {
    const { getAllTeams } = require('./teamStore');
    const { getStartingTeam } = require('../game/teamFactory');
    const allTeams = await getAllTeams();
    const teamsArray = Object.values(allTeams);
    const startingTeam = getStartingTeam(teamsArray);
    
    if (startingTeam) {
      player.currentTeam = startingTeam.id;
      
      // Generate contract
      const { generateContract } = require('../game/playerFactory');
      const contract = generateContract(startingTeam.id, player.overall);
      player.contract = contract;
      
      // Add to team squad
      const { addPlayerToTeam } = require('./teamStore');
      await addPlayerToTeam(startingTeam.id, player.userId);
      
      needsSave = true;
    }
  }
  
  // Add missing fields
  if (!player.pendingOffers) {
    player.pendingOffers = [];
    needsSave = true;
  }
  
  if (!player.season) {
    player.season = {
      number: 1,
      matchesPlayed: 0
    };
    needsSave = true;
  }
  
  if (!player.careerStats) {
    player.careerStats = {
      bigGamePerformances: 0,
      trophies: []
    };
    needsSave = true;
  }
  
  if (needsSave) {
    await savePlayer(player);
  }
  
  return player;
}

/**
 * Get a specific player by userId
 * @param {string} userId - Discord user ID
 * @returns {Promise<Object|null>} Player object or null if not found
 */
async function getPlayer(userId) {
  const players = await getAllPlayers();
  const player = players[userId] || null;
  
  if (player) {
    // Migrate if needed
    return await migratePlayer(player);
  }
  
  return null;
}

/**
 * Save a player to storage
 * @param {Object} player - Player object with userId
 * @returns {Promise<void>}
 */
async function savePlayer(player) {
  await ensureDataDir();
  const players = await getAllPlayers();
  players[player.userId] = player;
  
  // Atomic write: write to temp file first, then rename
  const tempFile = `${PLAYERS_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(players, null, 2), 'utf8');
  await fs.rename(tempFile, PLAYERS_FILE);
}

module.exports = {
  getPlayer,
  savePlayer,
  getAllPlayers
};

