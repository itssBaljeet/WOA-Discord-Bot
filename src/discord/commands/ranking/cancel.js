const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter, Fight, Admin } = require('../../../../models');
const path = require('path');
const fs = require('fs');
const logError = require('../../../../utils/logError.js');

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

    const configPath = path.join(__dirname, '../../../../extraResources/config.json');
    // const configPath = path.join(process.resourcesPath, 'config.json');
    let idConfig = JSON.parse(fs.readFileSync(configPath));

    // Checks if correct channel
    const channelId = idConfig.MAIN_TEXT_CHANNEL_ID;
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
        return interaction.reply('The fight does not exist.');
      }

      const fighter = await Fighter.findByPk(userId);
      
      if (!fighter) {
        return interaction.reply('You are not a participant of this fight.');
      }
      // Checks if user is admin
      const isAdmin = interaction.member.roles.cache.has(idConfig.ADMIN_ROLE_ID);

      if (!isAdmin && !fighter) {
        return interaction.reply({ content: 'You do not have permission to cancel this fight.', ephemeral: true });
      }

      // Reset the fighters' challenge statuses
      await Fighter.update(
        { hasSentChallenge: false },
        { where: { id: fight.fighter1Id } }
      );

      await Fighter.update(
        { hasBeenChallenged: false },
        { where: { id: fight.fighter2Id } }
      );

      await Fight.update({ winnerId: 'none', status: 'cancelled'}, {where: { id: fightId } });
      interaction.reply(`Fight ID ${fightId} has been cancelled.`);
    } catch (error) {
      console.error(error);
      logError(error);
      interaction.reply('An error occurred while trying to cancel the fight.');
    }
  },
};
