const { SlashCommandBuilder } = require('discord.js');
const { createPlayer } = require('../game/playerFactory');
const { savePlayer } = require('../utils/dataStore');
const { formatPlayerEmbed } = require('../utils/formatters');
const { getAllPositions } = require('../config/positions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create_player')
    .setDescription('Create your soccer player')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Your player\'s name')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('position')
        .setDescription('Your player\'s position')
        .setRequired(true)
        .addChoices(
          ...getAllPositions().map(pos => ({
            name: pos,
            value: pos
          }))
        )
    ),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const name = interaction.options.getString('name');
    const position = interaction.options.getString('position');
    
    // Check if player already exists
    const { getPlayer } = require('../utils/dataStore');
    const existingPlayer = await getPlayer(userId);
    
    if (existingPlayer) {
      return interaction.reply({
        content: '❌ You already have a player! Use `/view_player` to see your current player.',
        ephemeral: true
      });
    }
    
    // Create new player
    try {
      const player = await createPlayer(userId, name, position);
      
      // Save player
      await savePlayer(player);
      
      const embed = await formatPlayerEmbed(player);
      embed.setDescription('✅ Player created successfully!');
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error creating player:', error);
      return interaction.reply({
        content: '❌ An error occurred while creating your player. Please try again.',
        ephemeral: true
      });
    }
  }
};

