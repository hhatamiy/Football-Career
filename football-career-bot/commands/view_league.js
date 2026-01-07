const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPlayer } = require('../utils/dataStore');
const { getTeamsByLeague } = require('../utils/teamStore');
const { getLeague } = require('../config/leagues');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('view_league')
    .setDescription('View current league standings'),
  
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
      
      if (!player.currentTeam) {
        return interaction.reply({
          content: '❌ You are not currently on a team.',
          ephemeral: true
        });
      }
      
      const { getTeam } = require('../utils/teamStore');
      const team = await getTeam(player.currentTeam);
      
      if (!team) {
        return interaction.reply({
          content: '❌ Your team was not found.',
          ephemeral: true
        });
      }
      
      const league = getLeague(team.league);
      const allTeams = await getTeamsByLeague(team.league);
      
      // Sort by points, then goal difference, then goals for
      allTeams.sort((a, b) => {
        if (b.standings.points !== a.standings.points) {
          return b.standings.points - a.standings.points;
        }
        const gdA = a.standings.goalsFor - a.standings.goalsAgainst;
        const gdB = b.standings.goalsFor - b.standings.goalsAgainst;
        if (gdB !== gdA) {
          return gdB - gdA;
        }
        return b.standings.goalsFor - a.standings.goalsFor;
      });
      
      const embed = new EmbedBuilder()
        .setTitle(`📊 ${league.name} - Standings`)
        .setColor(0x0099FF)
        .setDescription(`Season ${player.season?.number || 1} - Match ${player.season?.matchesPlayed || 0}/${require('../config/tuning').SEASON_LENGTH}`);
      
      let standingsText = '';
      const promotionSpots = league.promotionSpots;
      const relegationSpots = league.relegationSpots;
      
      allTeams.forEach((t, index) => {
        const position = index + 1;
        const gd = t.standings.goalsFor - t.standings.goalsAgainst;
        const gdStr = gd >= 0 ? `+${gd}` : `${gd}`;
        
        let prefix = `${position}. `;
        if (position <= promotionSpots && promotionSpots > 0) {
          prefix = `🔼 ${position}. `;
        } else if (position > allTeams.length - relegationSpots && relegationSpots > 0) {
          prefix = `🔽 ${position}. `;
        }
        
        const highlight = t.id === team.id ? '**' : '';
        standingsText += `${prefix}${highlight}${t.name}${highlight} - ${t.standings.points}pts (${t.standings.wins}W-${t.standings.draws}D-${t.standings.losses}L) GD: ${gdStr}\n`;
      });
      
      embed.addFields({
        name: 'Standings',
        value: standingsText || 'No matches played yet',
        inline: false
      });
      
      embed.setFooter({ text: `🔼 = Promotion | 🔽 = Relegation` });
      embed.setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error viewing league:', error);
      return interaction.reply({
        content: '❌ An error occurred while retrieving league standings. Please try again.',
        ephemeral: true
      });
    }
  }
};

