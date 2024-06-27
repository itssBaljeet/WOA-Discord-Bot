const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fight, PreviousFight, Fighter } = require('../../../../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('end_fight')
    .setDescription('Ends a fight and records the winner')
    .addIntegerOption(option => 
      option.setName('fight_id')
        .setDescription('The ID of the fight to end')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('winner_name')
        .setDescription('The name of the winner')
        .setRequired(true)),
  async execute(interaction) {
    const fightId = interaction.options.getInteger('fight_id');
    const winnerName = interaction.options.getString('winner_name');

    try {
      const fight = await Fight.findByPk(fightId);
      if (!fight) {
        return interaction.reply('The fight does not exist.');
      }

      const fighter1 = await Fighter.findByPk(fight.fighter1Id);
      const fighter2 = await Fighter.findByPk(fight.fighter2Id);
      const winner = winnerName === fighter1.name ? fighter1 : winnerName === fighter2.name ? fighter2 : null;

      if (!winner) {
        return interaction.reply('Winner name does not match any fighters in the fight.');
      }

      await PreviousFight.create({
        fighter1Id: fighter1.id,
        fighter2Id: fighter2.id,
        winnerId: winner.id,
        fightDate: new Date(),
      });

      if (winner.id === fighter1.id) {
        await fighter1.increment('wins');
        await fighter2.increment('losses');
      } else {
        await fighter1.increment('losses');
        await fighter2.increment('wins');
      }

      await fight.destroy();
      interaction.reply(`Fight ID ${fightId} has ended. Winner: ${winner.name}`);
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while ending the fight.');
    }
  },
};
