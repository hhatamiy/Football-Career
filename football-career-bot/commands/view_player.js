const { SlashCommandBuilder } = require('discord.js');
const { getPlayer } = require('../utils/dataStore');
const { formatPlayerEmbed } = require('../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('view_player')
    .setDescription('View your player\'s stats and information'),
  
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
      
      const embed = await formatPlayerEmbed(player);
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error viewing player:', error);
      return interaction.reply({
        content: '❌ An error occurred while retrieving your player. Please try again.',
        ephemeral: true
      });
    }
  }
};

