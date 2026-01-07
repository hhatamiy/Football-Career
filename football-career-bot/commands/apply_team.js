const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer, savePlayer } = require('../utils/dataStore');
const { getTeam } = require('../utils/teamStore');
const { generateOffer, shouldTeamMakeOffer } = require('../game/offerEngine');
const { getLeague } = require('../config/leagues');
const { formatValue } = require('../utils/formatters');
const { chance } = require('../utils/random');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apply_team')
    .setDescription('Apply to a specific team')
    .addStringOption(option =>
      option
        .setName('team_id')
        .setDescription('The ID of the team to apply to (e.g., LEAGUE_3_1)')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const teamId = interaction.options.getString('team_id');
    
    try {
      const player = await getPlayer(userId);
      
      if (!player) {
        return interaction.reply({
          content: '❌ You haven\'t created a player yet. Use `/create_player` to get started!',
          ephemeral: true
        });
      }
      
      const team = await getTeam(teamId);
      
      if (!team) {
        return interaction.reply({
          content: '❌ Team not found. Use `/view_teams` to see available teams.',
          ephemeral: true
        });
      }
      
      if (player.currentTeam === teamId) {
        return interaction.reply({
          content: '❌ You are already playing for this team!',
          ephemeral: true
        });
      }
      
      // Check if team would make an offer
      if (!shouldTeamMakeOffer(team, player)) {
        return interaction.reply({
          content: `❌ ${team.name} is not interested in signing you at this time. Improve your performance to attract their attention!`,
          ephemeral: true
        });
      }
      
      // Chance to get an offer (not guaranteed)
      if (!chance(70)) {
        return interaction.reply({
          content: `❌ ${team.name} has declined your application. Keep improving and try again later!`,
          ephemeral: true
        });
      }
      
      // Generate offer
      const offer = generateOffer(player, team);
      
      // Add to pending offers
      if (!player.pendingOffers) {
        player.pendingOffers = [];
      }
      
      // Remove any existing offer from this team
      player.pendingOffers = player.pendingOffers.filter(o => o.teamId !== teamId);
      player.pendingOffers.push(offer);
      
      await savePlayer(player);
      
      const league = getLeague(team.league);
      const embed = new EmbedBuilder()
        .setTitle('✅ Application Successful!')
        .setColor(0x00FF00)
        .setDescription(`${team.name} has made you an offer!`)
        .addFields(
          {
            name: '📋 Offer Details',
            value: `💰 Salary: €${formatValue(offer.salary)}M/year\n📅 Contract: ${offer.contractLength} years\n🎁 Signing Bonus: €${formatValue(offer.signingBonus)}M`,
            inline: false
          },
          {
            name: '🏢 Team Info',
            value: `**${team.name}**\n${league.name}\nRating: ${team.rating}`,
            inline: false
          }
        )
        .setFooter({ text: `Use /accept_offer ${offer.id} to accept this offer` })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error applying to team:', error);
      return interaction.reply({
        content: '❌ An error occurred while applying to the team. Please try again.',
        ephemeral: true
      });
    }
  }
};

