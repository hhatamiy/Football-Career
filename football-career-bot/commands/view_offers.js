const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer } = require('../utils/dataStore');
const { cleanExpiredOffers } = require('../game/offerEngine');
const { formatValue } = require('../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('view_offers')
    .setDescription('View your pending transfer offers'),
  
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
      
      // Clean expired offers
      cleanExpiredOffers(player);
      await require('../utils/dataStore').savePlayer(player);
      
      if (!player.pendingOffers || player.pendingOffers.length === 0) {
        return interaction.reply({
          content: '📭 You have no pending transfer offers. Keep playing well to attract interest!',
          ephemeral: true
        });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('📬 Transfer Offers')
        .setColor(0x0099FF)
        .setDescription(`You have ${player.pendingOffers.length} pending offer(s)`);
      
      player.pendingOffers.forEach((offer, index) => {
        const expiryDate = new Date(offer.expiryDate);
        const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        embed.addFields({
          name: `${index + 1}. ${offer.teamName} (${offer.league})`,
          value: `💰 Salary: €${formatValue(offer.salary)}M/year\n📅 Contract: ${offer.contractLength} years\n🎁 Signing Bonus: €${formatValue(offer.signingBonus)}M\n⏰ Expires in: ${daysRemaining} days\n\nUse \`/accept_offer ${offer.id}\` to accept`,
          inline: false
        });
      });
      
      embed.setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error viewing offers:', error);
      return interaction.reply({
        content: '❌ An error occurred while retrieving your offers. Please try again.',
        ephemeral: true
      });
    }
  }
};

