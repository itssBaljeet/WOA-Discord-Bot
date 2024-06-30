const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter } = require('../../../../models');
const path = require('path');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register as a fighter'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const userName = interaction.user.username;

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
      const fighter = await Fighter.findByPk(userId);
      if (fighter) {
        return interaction.reply('You are already registered.');
      }

      await Fighter.create({ id: userId, name: userName, rank: 1 });
      interaction.reply(`You have been registered as a fighter, ${userName}!`);
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while trying to register.');
    }
  },
};
