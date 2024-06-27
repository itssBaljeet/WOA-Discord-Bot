const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter, Fight, Admin } = require('../../../../models');

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

    try {
      const fight = await Fight.findByPk(fightId);
      if (!fight) {
        return interaction.reply('The fight does not exist.');
      }

      const fighter = await Fighter.findByPk(userId);
      const admin = await Admin.findByPk(userId);
      
      if (!fighter && !admin) {
        return interaction.reply('You are not a participant of this fight or an admin.');
      }
      
      if (fight.fighter1Id !== userId && fight.fighter2Id !== userId && !admin) {
        return interaction.reply('You do not have permission to cancel this fight.');
      }

      await Fight.destroy({ where: { id: fightId } });
      interaction.reply(`Fight ID ${fightId} has been cancelled.`);
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while trying to cancel the fight.');
    }
  },
};
