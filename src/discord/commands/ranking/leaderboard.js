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
        return interaction.reply({ content: 'No fighters registered yet.', ephemeral: true });
      }

      // Find the length of the longest username
      const maxLength = fighters.reduce((max, fighter) => Math.max(max, fighter.name.length), 0);

      let leaderboard = 'Leaderboard:\n';
      fighters.forEach((fighter, index) => {
        const paddedName = fighter.name.padEnd(maxLength + 3);
        leaderboard += `${(index + 1).toString().padStart(2)}. ${paddedName} (Rank: ${fighter.rank}, Wins: ${fighter.wins}, Losses: ${fighter.losses})\n`;
      });

      // Wrap the leaderboard in a code block to use a monospaced font
      leaderboard = `\`\`\`\n${leaderboard}\`\`\``;

      interaction.reply({ content: leaderboard, ephemeral: true });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'An error occurred while fetching the leaderboard.', ephemeral: true});
    }
  },
};

