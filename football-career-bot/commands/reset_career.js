const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer, savePlayer } = require('../utils/dataStore');
const { removePlayerFromTeam } = require('../utils/teamStore');
const { createPlayer } = require('../game/playerFactory');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset_career')
    .setDescription('⚠️ Reset your player to starting stats (keeps name and position)')
    .addStringOption(option =>
      option
        .setName('confirm')
        .setDescription('Type "RESET" to confirm')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const confirmation = interaction.options.getString('confirm');
    
    if (confirmation !== 'RESET') {
      return interaction.reply({
        content: '❌ Confirmation failed. You must type "RESET" (all caps) to reset your career.',
        ephemeral: true
      });
    }
    
    try {
      const player = await getPlayer(userId);
      
      if (!player) {
        return interaction.reply({
          content: '❌ You don\'t have a player to reset. Use `/create_player` to get started!',
          ephemeral: true
        });
      }
      
      // Store original name and position
      const originalName = player.name;
      const originalPosition = player.position;
      const originalUserId = player.userId;
      
      // Remove from current team
      if (player.currentTeam) {
        await removePlayerFromTeam(player.currentTeam, userId);
      }
      
      // Create new player with same name and position
      const newPlayer = await createPlayer(originalUserId, originalName, originalPosition);
      
      // Save the reset player
      await savePlayer(newPlayer);
      
      const embed = new EmbedBuilder()
        .setTitle('🔄 Career Reset')
        .setColor(0xFFA500)
        .setDescription('Your career has been reset to starting stats!')
        .addFields(
          {
            name: '📊 Reset Stats',
            value: `**Name:** ${newPlayer.name}\n**Position:** ${newPlayer.position}\n**Age:** ${newPlayer.age}\n**Overall:** ${newPlayer.overall}\n**Potential:** ${newPlayer.potential}`,
            inline: false
          },
          {
            name: '⚠️ Warning',
            value: 'All progress, stats, matches, goals, assists, and transfer offers have been reset!',
            inline: false
          }
        )
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error resetting career:', error);
      return interaction.reply({
        content: '❌ An error occurred while resetting your career. Please try again.',
        ephemeral: true
      });
    }
  }
};

