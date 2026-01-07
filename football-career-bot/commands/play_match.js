const { SlashCommandBuilder } = require('discord.js');
const { getPlayer, savePlayer } = require('../utils/dataStore');
const { playMatch } = require('../game/matchEngine');
const { formatMatchEmbed } = require('../utils/formatters');
const { updateAge, checkPotential } = require('../game/progressionEngine');
const { updateMarketValue } = require('../game/valueEngine');
const TUNING = require('../config/tuning');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play_match')
    .setDescription('Play a match to improve your stats and career'),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    
    try {
      const player = await getPlayer(userId);
      
      if (!player) {
        return interaction.reply({
          content: '❌ You haven\'t created a player yet. Use `/create_player` to get started!',
          ephemeral: true
        });
      }
      
      // Check for active injury
      if (player.injury && player.injury.matchesRemaining > 0) {
        return interaction.reply({
          content: `❌ You are injured! You cannot play for ${player.injury.matchesRemaining} more match(es). Rest and recover!`,
          ephemeral: true
        });
      }
      
      // Check stamina threshold
      if (player.stamina < TUNING.STAMINA_MATCH_THRESHOLD) {
        return interaction.reply({
          content: `❌ Your stamina is too low (${player.stamina}/100). You need at least ${TUNING.STAMINA_MATCH_THRESHOLD} stamina to play a match. Use \`/rest\` to recover.`,
          ephemeral: true
        });
      }
      
      // Play match
      const results = await playMatch(player);
      
      // If player was injured during match, show special message
      if (results.injury && results.injury.message && results.injury.message.includes('still injured')) {
        return interaction.reply({
          content: results.injury.message,
          ephemeral: true
        });
      }
      
      // Check for age increase
      const oldAge = player.age;
      updateAge(player);
      
      // Check potential cap
      checkPotential(player);
      
      // Apply form decay
      const { applyFormDecay } = require('../game/progressionEngine');
      await applyFormDecay(player);
      
      // Update market value
      updateMarketValue(player);
      
      // Check for new transfer offers
      const { checkForNewOffers } = require('../game/offerEngine');
      await checkForNewOffers(player, results);
      
      // Save player
      await savePlayer(player);
      
      const embed = formatMatchEmbed(results, player);
      
      // Add age increase message if applicable
      if (player.age > oldAge) {
        embed.setDescription(`🎂 You've turned ${player.age}!`);
      }
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error playing match:', error);
      return interaction.reply({
        content: '❌ An error occurred while playing the match. Please try again.',
        ephemeral: true
      });
    }
  }
};

