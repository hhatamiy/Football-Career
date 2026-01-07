const { SlashCommandBuilder } = require('discord.js');
const { getPlayer, savePlayer } = require('../utils/dataStore');
const { train } = require('../game/trainingEngine');
const { formatTrainingEmbed } = require('../utils/formatters');
const { updateMarketValue } = require('../game/valueEngine');
const TUNING = require('../config/tuning');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('train')
    .setDescription('Train to improve your stats'),
  
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
      
      // Check stamina threshold
      if (player.stamina < TUNING.STAMINA_TRAIN_THRESHOLD) {
        return interaction.reply({
          content: `❌ Your stamina is too low (${player.stamina}/100). You need at least ${TUNING.STAMINA_TRAIN_THRESHOLD} stamina to train. Use \`/rest\` to recover.`,
          ephemeral: true
        });
      }
      
      // Execute training
      const results = train(player);
      
      // Update market value
      updateMarketValue(player);
      
      // Save player
      await savePlayer(player);
      
      const embed = formatTrainingEmbed(results, player);
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error training:', error);
      return interaction.reply({
        content: '❌ An error occurred while training. Please try again.',
        ephemeral: true
      });
    }
  }
};

