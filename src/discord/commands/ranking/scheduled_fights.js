const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fight, Fighter } = require('../../../../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scheduled_fights')
    .setDescription('Shows all currently scheduled fights'),
  async execute(interaction) {
    try {
      const fights = await Fight.findAll();
      if (fights.length === 0) {
        return interaction.reply('No fights are currently scheduled.');
      }

      let scheduledFights = 'Scheduled Fights:\n';
      for (const fight of fights) {
        const fighter1 = await Fighter.findByPk(fight.fighter1Id);
        const fighter2 = await Fighter.findByPk(fight.fighter2Id);
        scheduledFights += `Fight ID: ${fight.id} - ${fighter1.name} vs ${fighter2.name}\n`;
      }

      interaction.reply(scheduledFights);
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while fetching scheduled fights.');
    }
  },
};
