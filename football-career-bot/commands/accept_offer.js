const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer, savePlayer } = require('../utils/dataStore');
const { getTeam } = require('../utils/teamStore');
const { addPlayerToTeam, removePlayerFromTeam } = require('../utils/teamStore');
const { isOfferExpired } = require('../game/offerEngine');
const { getLeague } = require('../config/leagues');
const { formatValue } = require('../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('accept_offer')
    .setDescription('Accept a transfer offer')
    .addStringOption(option =>
      option
        .setName('offer_id')
        .setDescription('The ID of the offer to accept')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const offerId = interaction.options.getString('offer_id');
    
    try {
      const player = await getPlayer(userId);
      
      if (!player) {
        return interaction.reply({
          content: '❌ You haven\'t created a player yet. Use `/create_player` to get started!',
          ephemeral: true
        });
      }
      
      if (!player.pendingOffers || player.pendingOffers.length === 0) {
        return interaction.reply({
          content: '❌ You have no pending offers. Use `/view_offers` to see your offers.',
          ephemeral: true
        });
      }
      
      const offer = player.pendingOffers.find(o => o.id === offerId);
      
      if (!offer) {
        return interaction.reply({
          content: '❌ Offer not found. Use `/view_offers` to see your current offers.',
          ephemeral: true
        });
      }
      
      if (isOfferExpired(offer)) {
        player.pendingOffers = player.pendingOffers.filter(o => o.id !== offerId);
        await savePlayer(player);
        return interaction.reply({
          content: '❌ This offer has expired.',
          ephemeral: true
        });
      }
      
      // Get team info
      const newTeam = await getTeam(offer.teamId);
      if (!newTeam) {
        return interaction.reply({
          content: '❌ The team making this offer no longer exists.',
          ephemeral: true
        });
      }
      
      // Remove from old team
      if (player.currentTeam) {
        await removePlayerFromTeam(player.currentTeam, userId);
      }
      
      // Add to new team
      await addPlayerToTeam(offer.teamId, userId);
      
      // Update player contract
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + offer.contractLength);
      
      player.currentTeam = offer.teamId;
      player.contract = {
        teamId: offer.teamId,
        salary: offer.salary,
        length: offer.contractLength,
        startDate: new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
        releaseClause: player.marketValue * 2
      };
      
      // Remove accepted offer and all other offers
      player.pendingOffers = [];
      
      // Update market value slightly (moving to better team increases value)
      const league = getLeague(newTeam.league);
      if (league.tier > 1) {
        player.marketValue *= 1.05; // 5% increase for moving up
      }
      
      await savePlayer(player);
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Transfer Completed!')
        .setColor(0x00FF00)
        .setDescription(`You have joined **${newTeam.name}**!`)
        .addFields(
          {
            name: '📋 Contract Details',
            value: `💰 Salary: €${formatValue(offer.salary)}M/year\n📅 Length: ${offer.contractLength} years\n🎁 Signing Bonus: €${formatValue(offer.signingBonus)}M`,
            inline: false
          },
          {
            name: '🏢 New Team',
            value: `**${newTeam.name}**\n${getLeague(newTeam.league).name}\nRating: ${newTeam.rating}`,
            inline: false
          }
        )
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error accepting offer:', error);
      return interaction.reply({
        content: '❌ An error occurred while accepting the offer. Please try again.',
        ephemeral: true
      });
    }
  }
};

