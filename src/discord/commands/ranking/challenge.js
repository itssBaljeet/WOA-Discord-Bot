const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Fighter, Fight } = require('../../../models/index.js');
const { Op } = require('sequelize');
const logError = require('../../../utils/logError.js');

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

      let combatStyleSelected = false;
      let currentCombatStyle = 'Not selected yet';
      let pingedChallenger = false;

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

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_combat_style')
        .setPlaceholder('Choose combat style!')
        .addOptions([
          { label: 'Close', value: 'close' },
          { label: 'Medium', value: 'medium' },
          { label: 'Long', value: 'long' },
        ]);

      const rowSelect = new ActionRowBuilder()
        .addComponents(selectMenu);

      const challengeMessage = await interaction.reply({ 
        content: `${opponent}, you have been challenged by ${interaction.user.username}!\nCurrent Combat Style: ${currentCombatStyle}`, 
        components: [row, rowSelect], 
        fetchReply: true 
      });

      const filter = i => i.customId === 'accept_challenge' || i.customId === 'deny_challenge' || i.customId === 'select_combat_style';
      const collector = challengeMessage.createMessageComponentCollector({ filter, time: 10800000  }); // Collects for three hours total before time out

      collector.on('collect', async i => {
        if (i.customId === 'select_combat_style') {
          if (i.user.id !== challengerId) {
            return i.reply({ content: 'Only the challenger can select the combat style.', ephemeral: true });
          }
          currentCombatStyle = i.values[0];
          await fight.update({ combatStyle: currentCombatStyle });
          combatStyleSelected = true;
          await i.deferUpdate();

          // Update the message to reflect the current combat style
          await interaction.editReply({ content: `${opponent}, you have been challenged by ${interaction.user.username}!\nCurrent Combat Style: ${currentCombatStyle}`, components: [row, rowSelect] });
        }

        if (i.customId === 'accept_challenge') {
          if (i.user.id !== opponentId) {
            return i.reply({ content: 'You cannot respond to this challenge.', ephemeral: true });
          }
          if (!combatStyleSelected) {
            if (!pingedChallenger) {
              await i.reply(`${interaction.user}, you must select a combat style before your challenge can be accepted.`);
              pingedChallenger = true;
            } else {
              await i.deferUpdate();
            }
            return;
          }

          // Update the fight status to 'accepted'
          await fight.update({ status: 'accepted' });
          await i.update({ content: `${interaction.user.username} and ${opponent.username} are now set to fight! Fight ID: ${fight.id}`, components: [] });
          collector.stop();

        } else if (i.customId === 'deny_challenge') {
          if (i.user.id !== opponentId) {
            return i.reply({ content: 'You cannot respond to this challenge.', ephemeral: true });
          }
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
          try {
            await interaction.editReply({ content: 'Challenge expired.', components: [] });
          } catch (error) {
            logError(error, interaction.commandName, interaction.user.username);
            console.error('Failed to edit reply:', error);
          }
        }
      });
    } catch (error) {
      console.error(error);
      logError(error, interaction.commandName, interaction.user.username);
      try {
        await interaction.reply({ content: 'An error occurred while processing the challenge.', ephemeral: true });
      } catch (replyError) {
        console.error('Failed to send error reply:', replyError);
      }
    }
  },
};
