const { SlashCommandBuilder } = require('discord.js');
const { getPlayer, savePlayer } = require('../utils/dataStore');
const { random } = require('../utils/random');
const { formatRestEmbed } = require('../utils/formatters');
const TUNING = require('../config/tuning');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rest')
    .setDescription('Rest to recover stamina and improve form'),
  
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
      
      const oldStamina = player.stamina;
      
      // Recover stamina
      const staminaRecovery = random(
        TUNING.REST_STAMINA_RECOVERY_MIN,
        TUNING.REST_STAMINA_RECOVERY_MAX
      );
      player.stamina = Math.min(
        TUNING.STAMINA_MAX,
        player.stamina + staminaRecovery
      );
      
      // Improve form
      const formIncrease = random(
        TUNING.REST_FORM_INCREASE_MIN,
        TUNING.REST_FORM_INCREASE_MAX
      );
      player.form = Math.min(
        TUNING.FORM_MAX,
        player.form + formIncrease
      );
      
      const results = {
        oldStamina,
        formChange: formIncrease
      };
      
      // Save player
      await savePlayer(player);
      
      const embed = formatRestEmbed(results, player);
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error resting:', error);
      return interaction.reply({
        content: '❌ An error occurred while resting. Please try again.',
        ephemeral: true
      });
    }
  }
};

