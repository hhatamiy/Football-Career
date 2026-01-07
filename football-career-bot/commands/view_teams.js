const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTeamsByLeague } = require('../utils/teamStore');
const { getAllLeagues } = require('../config/leagues');
const { getPlayer } = require('../utils/dataStore');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('view_teams')
    .setDescription('Browse available teams')
    .addStringOption(option =>
      option
        .setName('league')
        .setDescription('Filter by league')
        .setRequired(false)
        .addChoices(
          { name: 'League 3', value: 'LEAGUE_3' },
          { name: 'League 2', value: 'LEAGUE_2' },
          { name: 'League 1', value: 'LEAGUE_1' },
          { name: 'Premier League', value: 'PREMIER_LEAGUE' }
        )
    ),
  
  async execute(interaction) {
    const leagueFilter = interaction.options.getString('league');
    
    try {
      const leagues = leagueFilter ? [require('../config/leagues').getLeague(leagueFilter)] : getAllLeagues();
      
      const embeds = [];
      
      for (const league of leagues) {
        const teams = await getTeamsByLeague(league.id);
        
        // Sort by rating
        teams.sort((a, b) => b.rating - a.rating);
        
        const embed = new EmbedBuilder()
          .setTitle(`🏢 ${league.name} - Teams`)
          .setColor(0x0099FF)
          .setDescription(`Showing ${teams.length} teams`);
        
        // Show top 10 teams per league
        const teamsToShow = teams.slice(0, 10);
        
        let teamsList = '';
        teamsToShow.forEach((team, index) => {
          const facilitiesStars = '⭐'.repeat(team.facilities);
          teamsList += `${index + 1}. **${team.name}** - Rating: ${team.rating} | ${facilitiesStars} | Budget: €${team.budget.toFixed(1)}M\n`;
        });
        
        if (teamsList) {
          embed.addFields({
            name: 'Top Teams',
            value: teamsList,
            inline: false
          });
        }
        
        embed.setFooter({ text: `Use /apply_team <team_id> to apply to a team` });
        embed.setTimestamp();
        
        embeds.push(embed);
      }
      
      // If filtering by one league, show more details
      if (leagueFilter && embeds.length > 0) {
        return interaction.reply({ embeds: embeds });
      }
      
      // Show first embed, mention others
      if (embeds.length > 0) {
        return interaction.reply({ 
          embeds: [embeds[0]],
          content: embeds.length > 1 ? `Showing ${leagueFilter ? 'filtered' : 'all'} leagues. Use \`/view_teams league:<league_name>\` to filter.` : undefined
        });
      }
      
      return interaction.reply({
        content: '❌ No teams found.',
        ephemeral: true
      });
    } catch (error) {
      console.error('Error viewing teams:', error);
      return interaction.reply({
        content: '❌ An error occurred while retrieving teams. Please try again.',
        ephemeral: true
      });
    }
  }
};

