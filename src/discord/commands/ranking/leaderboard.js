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
      // Defer the reply to give more time for processing
      await interaction.deferReply({ ephemeral: true });

      const fighters = await Fighter.findAll({ order: [['rank', 'ASC']] });
      if (fighters.length === 0) {
        return interaction.editReply({ content: 'No fighters registered yet.' });
      }

      // Fetch the user tags from Discord API
      const fightersWithTag = await Promise.all(fighters.map(async fighter => {
        try {
          const member = await interaction.guild.members.fetch(fighter.id);
          const displayName = member.displayName;
          return { ...fighter.toJSON(), displayName: displayName };
        } catch (fetchError) {
          console.error(`Failed to fetch member with ID ${fighter.id}:`, fetchError);
          return { ...fighter.toJSON(), displayName: fighter.name }; // Fallback to name if user fetch fails
        }
      }));

      // Find the length of the longest display name
      const maxLength = fightersWithTag.reduce((max, fighter) => Math.max(max, fighter.displayName.length), 0);

      let leaderboard = 'Leaderboard:\n';
      fightersWithTag.forEach((fighter, index) => {
        const paddedName = fighter.displayName.padEnd(maxLength + 3);
        leaderboard += `${(index + 1).toString().padStart(2)}. ${paddedName} (Wins: ${fighter.wins}, Losses: ${fighter.losses})\n`;
      });

      // Wrap the leaderboard in a code block to use a monospaced font
      leaderboard = `\`\`\`\n${leaderboard}\`\`\``;

      interaction.editReply({ content: leaderboard });
    } catch (error) {
      console.error(error);
      logError(error, interaction.commandName, interaction.user.username);
      interaction.editReply({ content: 'An error occurred while fetching the leaderboard.' });
    }
  },
};
