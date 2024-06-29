const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter } = require('../../../../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Displays the leaderboard based on ranks'),
  async execute(interaction) {
    try {
      const fighters = await Fighter.findAll({ order: [['rank', 'ASC']] });
      if (fighters.length === 0) {
        return interaction.reply('No fighters registered yet.');
      }

      let leaderboard = 'Leaderboard:\n';
      fighters.forEach((fighter, index) => {
        leaderboard += `${index + 1}. ${fighter.name} (Rank: ${fighter.rank}, Wins: ${fighter.wins}, Losses: ${fighter.losses})\n`;
      });

      interaction.reply({ content: leaderboard, ephemeral: true});
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while fetching the leaderboard.');
    }
  },
};
