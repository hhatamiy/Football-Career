const { EmbedBuilder } = require('discord.js');
const { getPosition } = require('../config/positions');

/**
 * Format player data into a Discord embed
 * @param {Object} player - Player object
 * @returns {Promise<EmbedBuilder>} Discord embed
 */
async function formatPlayerEmbed(player) {
  const position = getPosition(player.position);
  
  let teamInfo = 'Free Agent';
  let contractInfo = 'No contract';
  
  if (player.currentTeam) {
    const { getTeam } = require('./teamStore');
    const { getLeague } = require('../config/leagues');
    const team = await getTeam(player.currentTeam);
    
    if (team) {
      const league = getLeague(team.league);
      teamInfo = `**${team.name}**\n${league.name} (Rating: ${team.rating})`;
      
      if (player.contract) {
        const expiryDate = new Date(player.contract.expiryDate);
        const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        contractInfo = `Salary: €${formatValue(player.contract.salary)}M/year\nLength: ${player.contract.length} years\nExpires: ${daysRemaining} days`;
      }
    }
  }
  
  const embed = new EmbedBuilder()
    .setTitle(`⚽ ${player.name}`)
    .setColor(0x00AE86)
    .addFields(
      {
        name: '📊 Basic Info',
        value: `**Position:** ${position.name} (${player.position})\n**Age:** ${player.age}\n**Overall:** ${player.overall}\n**Potential:** ${player.potential}`,
        inline: false
      },
      {
        name: '🎯 Stats',
        value: `⚡ Pace: ${player.stats.pace}\n🎯 Shooting: ${player.stats.shooting}\n📤 Passing: ${player.stats.passing}\n🛡️ Defending: ${player.stats.defending}\n💪 Physical: ${player.stats.physical}`,
        inline: true
      },
      {
        name: '📈 Status',
        value: `📊 Form: ${formatForm(player.form)}\n⚡ Stamina: ${player.stamina}/100\n💰 Market Value: €${formatValue(player.marketValue)}M${player.injury && player.injury.matchesRemaining > 0 ? `\n⚠️ Injured: ${player.injury.matchesRemaining} matches out` : ''}`,
        inline: true
      },
      {
        name: '🏢 Team & Contract',
        value: `${teamInfo}\n\n${contractInfo}`,
        inline: false
      },
      {
        name: '🏆 Career Stats',
        value: `🎮 Matches: ${player.matchesPlayed}\n⚽ Goals: ${player.goals}\n🎯 Assists: ${player.assists}`,
        inline: false
      }
    )
    .setFooter({ text: `Player ID: ${player.userId}` })
    .setTimestamp();

  return embed;
}

/**
 * Format match results into a Discord embed
 * @param {Object} results - Match results object
 * @param {Object} player - Updated player object
 * @returns {EmbedBuilder} Discord embed
 */
function formatMatchEmbed(results, player) {
  const embed = new EmbedBuilder()
    .setTitle('⚽ Match Result')
    .setColor(results.rating >= 7 ? 0x00FF00 : results.rating >= 5 ? 0xFFFF00 : 0xFF0000)
    .addFields(
      {
        name: '📊 Performance',
        value: `⭐ Rating: ${results.rating.toFixed(1)}/10\n⚽ Goals: ${results.goals}\n🎯 Assists: ${results.assists}`,
        inline: false
      },
      {
        name: '📈 Updates',
        value: `📊 Form: ${formatForm(player.form)} (${results.formChange > 0 ? '+' : ''}${results.formChange})\n⚡ Stamina: ${player.stamina}/100\n💰 Market Value: €${formatValue(player.marketValue)}M`,
        inline: false
      }
    );

  if (results.injury) {
    const injuryMsg = results.injury.message || results.injury;
    embed.addFields({
      name: '⚠️ Injury',
      value: injuryMsg,
      inline: false
    });
  }
  
  if (results.highPressure) {
    embed.addFields({
      name: '🔥 High Pressure Match',
      value: 'This was an important match!',
      inline: false
    });
  }

  embed.setTimestamp();

  return embed;
}

/**
 * Format training results into a Discord embed
 * @param {Object} results - Training results object
 * @param {Object} player - Updated player object
 * @returns {EmbedBuilder} Discord embed
 */
function formatTrainingEmbed(results, player) {
  const embed = new EmbedBuilder()
    .setTitle('🏋️ Training Session')
    .setColor(0x0099FF)
    .addFields(
      {
        name: '📈 Stat Improvements',
        value: results.statChanges.map(change => 
          `${getStatEmoji(change.stat)} ${change.stat}: ${change.oldValue} → ${change.newValue} (+${change.newValue - change.oldValue})`
        ).join('\n') || 'No stat improvements',
        inline: false
      },
      {
        name: '📊 Status',
        value: `📊 Form: ${formatForm(player.form)} (${results.formChange > 0 ? '+' : ''}${results.formChange})\n⚡ Stamina: ${player.stamina}/100`,
        inline: false
      }
    );

  if (results.injury) {
    embed.addFields({
      name: '⚠️ Injury',
      value: results.injury,
      inline: false
    });
  }

  embed.setTimestamp();

  return embed;
}

/**
 * Format rest results into a Discord embed
 * @param {Object} results - Rest results object
 * @param {Object} player - Updated player object
 * @returns {EmbedBuilder} Discord embed
 */
function formatRestEmbed(results, player) {
  const embed = new EmbedBuilder()
    .setTitle('😴 Rest Period')
    .setColor(0x00FF00)
    .addFields(
      {
        name: '💤 Recovery',
        value: `⚡ Stamina: ${results.oldStamina} → ${player.stamina} (+${player.stamina - results.oldStamina})\n📊 Form: ${formatForm(player.form)} (${results.formChange > 0 ? '+' : ''}${results.formChange})`,
        inline: false
      }
    )
    .setTimestamp();

  return embed;
}

/**
 * Format form value with emoji
 * @param {number} form - Form value
 * @returns {string} Formatted form string
 */
function formatForm(form) {
  if (form >= 5) return `🔥 ${form}`;
  if (form >= 2) return `✅ ${form}`;
  if (form >= -2) return `➖ ${form}`;
  if (form >= -5) return `⚠️ ${form}`;
  return `❌ ${form}`;
}

/**
 * Format market value
 * @param {number} value - Market value in millions
 * @returns {string} Formatted value string
 */
function formatValue(value) {
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

/**
 * Get emoji for stat name
 * @param {string} stat - Stat name
 * @returns {string} Emoji
 */
function getStatEmoji(stat) {
  const emojis = {
    pace: '⚡',
    shooting: '🎯',
    passing: '📤',
    defending: '🛡️',
    physical: '💪'
  };
  return emojis[stat] || '📊';
}

module.exports = {
  formatPlayerEmbed,
  formatMatchEmbed,
  formatTrainingEmbed,
  formatRestEmbed
};

