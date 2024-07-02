const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter, Fight } = require('../../../models/index.js');
const logError = require('../../../utils/logError.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cancel')
    .setDescription('Cancel an ongoing fight')
    .addIntegerOption(option => 
      option.setName('fightid')
        .setDescription('The ID of the fight to cancel')
        .setRequired(true)),
  async execute(interaction) {
    const fightId = interaction.options.getInteger('fightid');
    const userId = interaction.user.id;

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
      const fight = await Fight.findByPk(fightId);
      if (!fight) {
        return interaction.reply({ content: 'The fight does not exist.', ephemeral: true });
      }
      
      // Check if the user is an admin or a participant in the fight
      const isAdmin = interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID);
      const isParticipant = fight.fighter1Id === userId || fight.fighter2Id === userId;

      if (!isAdmin && !isParticipant) {
        return interaction.reply({ content: 'You do not have permission to cancel this fight.', ephemeral: true });
      }

      console.log('Resetting challenge statuses for fighters:', fight.fighter1Id, fight.fighter2Id);

      // Reset the fighters' challenge statuses
      await Fighter.update(
        { hasSentChallenge: false },
        { where: { id: fight.fighter1Id } }
      );

      await Fighter.update(
        { hasBeenChallenged: false },
        { where: { id: fight.fighter2Id } }
      );

      console.log('Updating fight status to cancelled:', fightId);

      await Fight.update({ winnerId: 'none', status: 'cancelled'}, {where: { id: fightId } });
      interaction.reply(`Fight ID ${fightId} has been cancelled.`);
      
    } catch (error) {
      console.error(error);
      logError(error, interaction.commandName, interaction.user.username);
      interaction.reply({ content: 'An error occurred while trying to cancel the fight.', ephemeral: true });
    }
  },
};
