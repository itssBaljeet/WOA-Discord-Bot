const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter, Fight, PreviousFight } = require('../../../../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('end_fight')
    .setDescription('End a fight and declare a winner')
    .addIntegerOption(option => 
      option.setName('fight_id')
        .setDescription('The ID of the fight to end')
        .setRequired(true))
    .addUserOption(option => 
      option.setName('winner')
        .setDescription('The winner of the fight')
        .setRequired(true)),
  async execute(interaction) {
    const fightId = interaction.options.getInteger('fight_id');
    const winner = interaction.options.getUser('winner');
    const winnerId = winner.id;

    try {
      const fight = await Fight.findByPk(fightId);
      if (!fight) {
        return interaction.reply('Fight not found.');
      }

      const fighter1 = await Fighter.findByPk(fight.fighter1Id);
      const fighter2 = await Fighter.findByPk(fight.fighter2Id);
      
      if (!fighter1 || !fighter2) {
        return interaction.reply('One or both fighters not found.');
      }

      let winnerFighter, loserFighter;

      if (winnerId === fighter1.id) {
        winnerFighter = fighter1;
        loserFighter = fighter2;
      } else if (winnerId === fighter2.id) {
        winnerFighter = fighter2;
        loserFighter = fighter1;
      } else {
        return interaction.reply('Winner must be one of the fighters in the fight.');
      }

      // Update the fight result
      await fight.update({ result: winnerId, status: 'completed' });

      // Add to previous fights
      await PreviousFight.create({
        fighter1Id: fight.fighter1Id,
        fighter2Id: fight.fighter2Id,
        winnerId: winnerId,
        fightDate: new Date(),
      });

      // Update win/loss records
      await winnerFighter.increment('wins');
      await loserFighter.increment('losses');

      if (winnerFighter.rank > loserFighter.rank) {
        const winnerOriginalRank = winnerFighter.rank;
        const loserOriginalRank = loserFighter.rank;

        // Update the winner's rank to the loser's rank
        console.log("Winner's previous rank:", winnerFighter.rank);
        await winnerFighter.update({ rank: loserOriginalRank });
        console.log("Winner's new rank:", winnerFighter.rank, "Winner original rank:", winnerOriginalRank);

        // Shift down ranks of fighters between the loser's original rank and the winner's original rank
        await Fighter.update(
          { rank: sequelize.literal('rank + 1') },
          {
            where: {
              rank: {
                [Op.between]: [loserOriginalRank + 1, winnerOriginalRank],
              },
            },
          }
        );

        // Update the loser's rank
        await loserFighter.update({ rank: sequelize.literal('rank + 1') });
      }

      await interaction.reply(`Fight ended. ${winner.username} is the winner and is now ranked ${winnerFighter.rank}.`);
    } catch (error) {
      console.error(error);
      await interaction.reply('An error occurred while ending the fight.');
    }
  },
};
