const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter } = require('../../../../models');
const { Op } = require('sequelize');
const sequelize  = require('sequelize');
const path = require('path');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete_fighter')
    .setDescription('Delete a fighter from the database')
    .addStringOption(option => 
      option.setName('fighter_id')
        .setDescription('The ID of the fighter to delete')
        .setRequired(true)),
  async execute(interaction) {
    const fighterId = interaction.options.getString('fighter_id');

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
      const fighter = await Fighter.findByPk(fighterId);

      if (!fighter) {
        return interaction.reply({ content: 'Fighter not found.', ephemeral: true });
      }

      const fighterRank = fighter.rank;

      // Delete the fighter
      await fighter.destroy();

      // Shift ranks of fighters below the deleted fighter
      await Fighter.update(
        { rank: sequelize.literal('rank - 1') },
        {
          where: {
            rank: {
              [Op.gt]: fighterRank,
            },
          },
        }
      );

      interaction.reply(`Fighter ${fighter.name} (ID: ${fighterId}) has been deleted.`);
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'An error occurred while deleting the fighter.', ephemeral: true });
    }
  },
};
