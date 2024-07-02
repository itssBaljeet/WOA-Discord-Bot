const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter } = require('../../../models');
const logError = require('../../../utils/logError');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register as a fighter'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const userName = interaction.user.username;

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
      const fighter = await Fighter.findByPk(userId);
      if (fighter) {
        return interaction.reply({ content: 'You are already registered.', ephemeral: true });
      }

      await Fighter.create({ id: userId, name: userName, rank: 1 });
      interaction.reply(`You have been registered as a fighter, ${userName}!`);
    } catch (error) {
      console.error(error);
      logError(error, interaction.commandName, interaction.user.username);
      interaction.reply('An error occurred while trying to register.');
    }
  },
};
