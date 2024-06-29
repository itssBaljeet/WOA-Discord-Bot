const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { Fighter, Fight } = require('../../../../models');
const { Op } = require('sequelize');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Challenge another fighter')
    .addUserOption(option => 
      option.setName('opponent')
        .setDescription('The fighter you want to challenge')
        .setRequired(true)),
  async execute(interaction) {
    const challengerId = interaction.user.id;
    const opponent = interaction.options.getUser('opponent');
    const opponentId = opponent.id;

    if (challengerId === opponentId) {
      return interaction.reply({ content: 'You cannot challenge yourself.', ephemeral: true });
    }

    try {
      const challenger = await Fighter.findByPk(challengerId);
      const opponentFighter = await Fighter.findByPk(opponentId);

      if (!challenger || !opponentFighter) {
        return interaction.reply('Both you and your opponent must be registered fighters.');
      }

      if (challenger.hasSentChallenge) {
        return interaction.reply('You have already sent a challenge this month.');
      }

      if (opponentFighter.hasBeenChallenged) {
        return interaction.reply('The opponent has already been challenged this month.');
      }

      if (challenger.rank === 1) {
        return interaction.reply('As the top-ranked fighter, you cannot challenge anyone.');
      }

      if (opponentFighter.rank < challenger.rank - 3) {
        return interaction.reply('You can only challenge fighters up to 3 ranks above you.');
      }

      if (opponentFighter.rank > challenger.rank) {
        return interaction.reply('You cannot challenge fighters that are lower ranks than you.');
      }

      const ongoingFight = await Fight.findOne({
        where: {
          [Op.or]: [
            { fighter1Id: challengerId },
            { fighter2Id: challengerId },
            { fighter1Id: opponentId },
            { fighter2Id: opponentId },
          ],
          status: 'pending' // Assuming 'pending' indicates an active challenge
        },
      });

      if (ongoingFight) {
        return interaction.reply('Either you or your opponent is already in a fight or has a pending challenge.');
      }

      // Create the fight with status 'pending'
      const fight = await Fight.create({ fighter1Id: challengerId, fighter2Id: opponentId, status: 'pending' });

      // Update the challenge status of the fighters
      await challenger.update({ hasSentChallenge: true });
      await opponentFighter.update({ hasBeenChallenged: true });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('accept_challenge')
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('deny_challenge')
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger)
        );

      const challengeMessage = await interaction.reply({ content: `${opponent}, you have been challenged by ${interaction.user.username}!`, components: [row], fetchReply: true });

      const filter = i => i.customId === 'accept_challenge' || i.customId === 'deny_challenge';
      const collector = challengeMessage.createMessageComponentCollector({ filter, time: 60000, componentType: ComponentType.Button });

      collector.on('collect', async i => {
        if (i.user.id !== opponentId) {
          return i.reply({ content: 'You cannot respond to this challenge.', ephemeral: true });
        }

        if (i.customId === 'accept_challenge') {
          // Update the fight status to 'accepted'
          await fight.update({ status: 'accepted' });
          await i.update({ content: `${interaction.user.username} and ${opponent.username} are now set to fight! Fight ID: ${fight.id}`, components: [] });
          collector.stop();
        } else if (i.customId === 'deny_challenge') {
          // Delete the fight record if the challenge is denied
          await fight.destroy();
          // Reset the challenge status
          await challenger.update({ hasSentChallenge: false });
          await opponentFighter.update({ hasBeenChallenged: false });
          await i.update({ content: `${opponent.username} has denied the challenge.`, components: [] });
          collector.stop();
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          // Delete the fight record if the challenge expires
          await fight.destroy();
          // Reset the challenge status
          await challenger.update({ hasSentChallenge: false });
          await opponentFighter.update({ hasBeenChallenged: false });
          await interaction.editReply({ content: 'Challenge expired.', components: [] });
        }
      });
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while processing the challenge.');
    }
  },
};
