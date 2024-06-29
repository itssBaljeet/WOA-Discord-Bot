const { SlashCommandBuilder } = require('@discordjs/builders');
const { PreviousFight, Fighter } = require('../../../../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('previous_fights')
    .setDescription('Displays all previous fights'),
  async execute(interaction) {
    try {
      const previousFights = await PreviousFight.findAll({ order: [['fightDate', 'DESC']] });
      if (previousFights.length === 0) {
        return interaction.reply('No previous fights found.');
      }

      let previousFightsInfo = 'Previous Fights:\n';
      for (const fight of previousFights) {
        const fighter1 = await Fighter.findByPk(fight.fighter1Id);
        const fighter2 = await Fighter.findByPk(fight.fighter2Id);
        const winner = await Fighter.findByPk(fight.winnerId);
        previousFightsInfo += `Fight ID: ${fight.id} - ${fighter1.name} vs ${fighter2.name}, Winner: ${winner.name}, Date: ${fight.fightDate.toDateString()}\n`;
      }

      interaction.reply({ content: previousFightsInfo, ephemeral: true });
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while fetching previous fights.');
    }
  },
};
