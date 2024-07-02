const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter } = require('../../../models/index.js');
const logError = require('../../../utils/logError.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Displays the leaderboard based on ranks'),
  async execute(interaction) {

    // Checks if correct channel
    const channelId = process.env.MAIN_TEXT_CHANNEL_ID;
    const channel = interaction.guild.channels.cache.get(channelId);
    const channelName = channel ? channel.name : 'the correct channel';
    if (interaction.channelId !== channelId) {
      return interaction.reply({ 
        content: `Please use this command in the correct channel: #${channelName}`, 
        ephemeral: true 
      });
    }

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
      logError(error, interaction.commandName, interaction.user.username);
      interaction.reply({ content: 'An error occurred while fetching the leaderboard.', ephemeral: true});
    }
  },
};
