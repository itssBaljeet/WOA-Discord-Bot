const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter } = require('../../../../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const logError = require('../../../../utils/logError.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set_rank')
    .setDescription('Set the rank of a fighter')
    .addUserOption(option => 
      option.setName('fighter')
        .setDescription('The fighter whose rank you want to change')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('rank')
        .setDescription('The new rank for the fighter')
        .setRequired(true)),
  async execute(interaction) {
    const fighterUser = interaction.options.getUser('fighter');
    const newRank = interaction.options.getInteger('rank');
    const fighterId = fighterUser.id;

    const configPath = path.join(__dirname, '../../../../extraResources/config.json');
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
      const fighter = await Fighter.findByPk(fighterId);

      if (!fighter) {
        return interaction.reply({ content: 'Fighter not found.', ephemeral: true });
      }

      const currentRank = fighter.rank;
      const targetFighter = await Fighter.findOne({ where: { rank: newRank } });

      if (!targetFighter) {
        return interaction.reply({ content: 'No fighter found at the specified rank.', ephemeral: true });
      }

      // Swap ranks
      await fighter.update({ rank: newRank });
      await targetFighter.update({ rank: currentRank });

      interaction.reply(`Set ${fighter.name} to rank ${newRank}, and ${targetFighter.name} to rank ${currentRank}.`);
    } catch (error) {
      console.error(error);
      logError(error);
      interaction.reply({ content: 'An error occurred while setting the rank.', ephemeral: true });
    }
  },
};
