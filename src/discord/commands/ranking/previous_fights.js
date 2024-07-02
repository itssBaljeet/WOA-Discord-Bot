const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter, Fight } = require('../../../models');
const { Op } = require('sequelize');
const logError = require('../../../utils/logError');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('previous_fights')
    .setDescription('Displays all previous fights')
    .addUserOption(option => 
      option.setName('fighter')
        .setDescription('The fighter to fetch previous fights for')
        .setRequired(true)),
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
      const fighter = interaction.options.getUser('fighter')
      const previousFights = await Fight.findAll({ 
        where: {
          status: 'completed',
          [Op.or]: [
            { fighter1Id: fighter.id },
            { fighter2Id: fighter.id },
          ],
        },
        order: [['fightDate', 'DESC']] 
      });
      if (previousFights.length === 0) {
        return interaction.reply({ content: 'No previous fights found.', ephemeral: true });
      }

      let previousFightsInfo = 'Previous Fights:\n';
      for (const fight of previousFights) {
        const fighter1 = await Fighter.findByPk(fight.fighter1Id);
        const fighter2 = await Fighter.findByPk(fight.fighter2Id);
        const winner = await Fighter.findByPk(fight.winnerId);

        if (!fighter1 || !fighter2 || !winner) {
          previousFightsInfo += `--Fight ID: ${fight.id}--\n One or more fighters not found, Date: ${fight.fightDate.toDateString()} Style: ${fight.combatStyle}\n`;
          continue;
        }

        previousFightsInfo += `--Fight ID: ${fight.id}--\n ${fighter1.name} vs ${fighter2.name}, Winner: ${winner.name}, Date: ${fight.fightDate.toDateString()} Style: ${fight.combatStyle}\n`;
      }

      // Wrap the previous fights info in a code block
      previousFightsInfo = `\`\`\`\n${previousFightsInfo}\`\`\``;

      interaction.reply({ content: previousFightsInfo, ephemeral: true });
    } catch (error) {
      console.error(error);
      logError(error, interaction.commandName, interaction.user.username);
      interaction.reply({ content: 'An error occurred while fetching previous fights.', ephemeral: true});
    }
  },
};
