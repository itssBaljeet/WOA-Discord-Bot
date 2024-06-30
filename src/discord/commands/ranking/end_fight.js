const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter, Fight, PreviousFight } = require('../../../../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
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
    const configPath = path.join(__dirname, '../../../../extraResources/config.json');
    // const configPath = path.join(process.resourcesPath, 'config.json');
    let idConfig = JSON.parse(fs.readFileSync(configPath));

    const member = interaction.guild.members.cache.get(interaction.user.id);
    const adminRoleId = idConfig.ADMIN_ROLE_ID;

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

    if (!member.roles.cache.has(adminRoleId)) {
      return interaction.reply({ content: 'You do not have permission to run this command.', ephemeral: true });
    }

    const fightId = interaction.options.getInteger('fight_id');
    const winner = interaction.options.getUser('winner');
    const winnerId = winner.id;

    try {
      const fight = await Fight.findByPk(fightId);
      if (!fight) {
        return interaction.reply({ content: 'Fight not found.', ephemeral: true });
      }

      const fighter1 = await Fighter.findByPk(fight.fighter1Id);
      const fighter2 = await Fighter.findByPk(fight.fighter2Id);
      
      if (!fighter1 || !fighter2) {
        return interaction.reply({ content: 'One or both fighters not found.', ephemeral: true });
      }

      let winnerFighter, loserFighter;

      if (winnerId === fighter1.id) {
        winnerFighter = fighter1;
        loserFighter = fighter2;
      } else if (winnerId === fighter2.id) {
        winnerFighter = fighter2;
        loserFighter = fighter1;
      } else {
        return interaction.reply({ content: 'Winner must be one of the fighters in the fight.', ephemeral: true });
      }

      // Update the fight result
      await fight.update({ status: 'completed', winnerId: winnerId, fightDate: new Date() });

      // Update win/loss records
      await winnerFighter.increment('wins');
      await loserFighter.increment('losses');

      if (winnerFighter.rank > loserFighter.rank) {
        const winnerOriginalRank = winnerFighter.rank;
        const loserOriginalRank = loserFighter.rank;

        // Update the winner's rank to the loser's rank
        await winnerFighter.update({ rank: loserOriginalRank });

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

      await interaction.reply(`Fight decided! ${winner.username} is the winner and is now ranked ${winnerFighter.rank}.`);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'An error occurred while ending the fight.', ephemeral: true });
    }
  },
};
