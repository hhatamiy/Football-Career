const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer, getAllPlayers, savePlayer } = require('../utils/dataStore');
const { removePlayerFromTeam } = require('../utils/teamStore');
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete_career')
    .setDescription('⚠️⚠️⚠️ PERMANENTLY DELETE your player (cannot be undone!)')
    .addStringOption(option =>
      option
        .setName('confirm')
        .setDescription('Type "DELETE PERMANENTLY" to confirm')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const confirmation = interaction.options.getString('confirm');
    
    if (confirmation !== 'DELETE PERMANENTLY') {
      return interaction.reply({
        content: '❌ Confirmation failed. You must type "DELETE PERMANENTLY" (all caps) to delete your career. This action cannot be undone!',
        ephemeral: true
      });
    }
    
    try {
      const player = await getPlayer(userId);
      
      if (!player) {
        return interaction.reply({
          content: '❌ You don\'t have a player to delete. Use `/create_player` to get started!',
          ephemeral: true
        });
      }
      
      // Store player info for confirmation message
      const playerName = player.name;
      const playerStats = {
        matches: player.matchesPlayed,
        goals: player.goals,
        assists: player.assists
      };
      
      // Remove from current team
      if (player.currentTeam) {
        await removePlayerFromTeam(player.currentTeam, userId);
      }
      
      // Delete player from storage
      const players = await getAllPlayers();
      delete players[userId];
      
      // Save updated players object
      const tempFile = `${PLAYERS_FILE}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(players, null, 2), 'utf8');
      await fs.rename(tempFile, PLAYERS_FILE);
      
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Career Deleted')
        .setColor(0xFF0000)
        .setDescription(`**${playerName}'s** career has been permanently deleted!`)
        .addFields(
          {
            name: '📊 Deleted Stats',
            value: `**Matches:** ${playerStats.matches}\n**Goals:** ${playerStats.goals}\n**Assists:** ${playerStats.assists}`,
            inline: false
          },
          {
            name: '⚠️ Permanent Action',
            value: 'This action cannot be undone. All progress has been permanently lost. Use `/create_player` to start a new career.',
            inline: false
          }
        )
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error deleting career:', error);
      return interaction.reply({
        content: '❌ An error occurred while deleting your career. Please try again.',
        ephemeral: true
      });
    }
  }
};

