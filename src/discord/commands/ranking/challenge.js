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
      if (!challenger) {
        return interaction.reply('You need to register first.');
      }

      const opponentFighter = await Fighter.findByPk(opponentId);
      if (!opponentFighter) {
        return interaction.reply('The opponent is not registered.');
      }

      if (opponentFighter.rank > challenger.rank + 2) {
        return interaction.reply('You can only challenge fighters up to 2 ranks above you.');
      }

      const existingFight = await Fight.findOne({
        where: {
          [Op.or]: [
            { fighter1Id: challengerId, fighter2Id: opponentId },
            { fighter1Id: opponentId, fighter2Id: challengerId },
          ],
        },
      });

      if (existingFight) {
        return interaction.reply('You already have an ongoing fight with this opponent.');
      }

      const ongoingFight = await Fight.findOne({
        where: {
          [Op.or]: [
            { fighter1Id: challengerId },
            { fighter2Id: challengerId },
            { fighter1Id: opponentId },
            { fighter2Id: opponentId },
          ],
        },
      });

      if (ongoingFight) {
        return interaction.reply('Either you or your opponent is already in a fight.');
      }

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
          const fight = await Fight.create({ fighter1Id: challengerId, fighter2Id: opponentId });
          await i.update({ content: `${interaction.user.username} and ${opponent.username} are now set to fight! Fight ID: ${fight.id}`, components: [] });
          collector.stop();
        } else if (i.customId === 'deny_challenge') {
          await i.update({ content: `${opponent.username} has denied the challenge.`, components: [] });
          collector.stop();
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({ content: 'Challenge expired.', components: [] });
        }
      });
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while processing the challenge.');
    }
  },
};
