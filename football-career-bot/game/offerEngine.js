const { random } = require('../utils/random');
const { getAllTeams } = require('../utils/teamStore');
const { getLeague } = require('../config/leagues');
const TUNING = require('../config/tuning');

/**
 * Generate a transfer offer for a player
 * @param {Object} player - Player object
 * @param {Object} team - Team making the offer
 * @returns {Object} Offer object
 */
function generateOffer(player, team) {
  const league = getLeague(team.league);
  
  // Base salary calculation
  const baseSalary = player.marketValue * 0.1;
  const salaryMultiplier = random(
    TUNING.OFFER_SALARY_MULTIPLIER_MIN * 100,
    TUNING.OFFER_SALARY_MULTIPLIER_MAX * 100
  ) / 100;
  
  const salary = Math.max(0.1, baseSalary * salaryMultiplier);
  const contractLength = random(
    TUNING.OFFER_CONTRACT_LENGTH_MIN,
    TUNING.OFFER_CONTRACT_LENGTH_MAX
  );
  const signingBonus = salary * TUNING.OFFER_SIGNING_BONUS_MULTIPLIER;
  
  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + TUNING.OFFER_EXPIRY_DAYS);
  
  return {
    id: `offer_${Date.now()}_${random(1000, 9999)}`,
    teamId: team.id,
    teamName: team.name,
    league: league.name,
    salary: parseFloat(salary.toFixed(2)),
    contractLength: contractLength,
    signingBonus: parseFloat(signingBonus.toFixed(2)),
    expiryDate: expiryDate.toISOString(),
    createdAt: new Date().toISOString()
  };
}

/**
 * Check if a team should make an offer to a player
 * @param {Object} team - Team object
 * @param {Object} player - Player object
 * @returns {boolean} True if team should make offer
 */
function shouldTeamMakeOffer(team, player) {
  // Teams only make offers if they can afford the player
  const estimatedCost = player.marketValue * 0.15; // Rough estimate
  if (team.budget < estimatedCost) return false;
  
  // Teams prefer players that fit their level
  const ratingDifference = Math.abs(team.rating - player.overall);
  if (ratingDifference > 20) return false; // Too big a gap
  
  // Teams in higher leagues prefer better players
  const league = getLeague(team.league);
  if (league.tier >= 3 && player.overall < 70) return false;
  if (league.tier >= 2 && player.overall < 60) return false;
  
  return true;
}

/**
 * Generate potential offers for a player
 * @param {Object} player - Player object
 * @param {number} maxOffers - Maximum number of offers to generate
 * @returns {Promise<Array<Object>>} Array of offers
 */
async function generateOffers(player, maxOffers = 3) {
  const allTeams = await getAllTeams();
  const teamsArray = Object.values(allTeams);
  
  // Filter teams that might make offers
  const potentialTeams = teamsArray.filter(team => {
    // Don't offer from current team
    if (team.id === player.currentTeam) return false;
    return shouldTeamMakeOffer(team, player);
  });
  
  // Randomly select teams
  const selectedTeams = [];
  const shuffled = [...potentialTeams].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(maxOffers, shuffled.length); i++) {
    selectedTeams.push(shuffled[i]);
  }
  
  // Generate offers
  const offers = selectedTeams.map(team => generateOffer(player, team));
  
  return offers;
}

/**
 * Check if an offer has expired
 * @param {Object} offer - Offer object
 * @returns {boolean} True if expired
 */
function isOfferExpired(offer) {
  const expiryDate = new Date(offer.expiryDate);
  return new Date() > expiryDate;
}

/**
 * Clean expired offers from player
 * @param {Object} player - Player object
 * @returns {Object} Updated player
 */
function cleanExpiredOffers(player) {
  if (!player.pendingOffers) {
    player.pendingOffers = [];
    return player;
  }
  
  player.pendingOffers = player.pendingOffers.filter(offer => !isOfferExpired(offer));
  return player;
}

/**
 * Add offers to player after good performance
 * @param {Object} player - Player object
 * @param {Object} matchResults - Match results
 * @returns {Promise<Object>} Updated player with new offers
 */
async function checkForNewOffers(player, matchResults) {
  // Only generate offers after good performances
  if (matchResults.rating < 7) return player;
  
  // Chance to generate offers
  const { chance } = require('../utils/random');
  if (!chance(TUNING.OFFER_GENERATION_CHANCE)) return player;
  
  // Clean expired offers first
  cleanExpiredOffers(player);
  
  // Generate new offers
  const newOffers = await generateOffers(player, 2);
  
  if (!player.pendingOffers) {
    player.pendingOffers = [];
  }
  
  // Add new offers (avoid duplicates from same team)
  newOffers.forEach(newOffer => {
    const existing = player.pendingOffers.find(o => o.teamId === newOffer.teamId);
    if (!existing) {
      player.pendingOffers.push(newOffer);
    }
  });
  
  return player;
}

module.exports = {
  generateOffer,
  generateOffers,
  isOfferExpired,
  cleanExpiredOffers,
  checkForNewOffers,
  shouldTeamMakeOffer
};

