const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');

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

    const db = interaction.client.db;

    db.get(`SELECT * FROM fighters WHERE id = ?`, [challengerId], (err, challengerRow) => {
      if (err) {
        console.error(err.message);
        return interaction.reply('An error occurred while processing the challenge.');
      }
      if (!challengerRow) {
        return interaction.reply('You need to register first.');
      }

      db.get(`SELECT * FROM fighters WHERE id = ?`, [opponentId], (err, opponentRow) => {
        if (err) {
          console.error(err.message);
          return interaction.reply('An error occurred while processing the challenge.');
        }
        if (!opponentRow) {
          return interaction.reply('The opponent is not registered.');
        }

        // Check rank difference
        if (opponentRow.rank > challengerRow.rank + 2) {
          return interaction.reply('You can only challenge fighters up to 2 ranks above you.');
        }

        const row = new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId('accept_challenge')
              .setLabel('Accept')
              .setStyle('SUCCESS'),
            new MessageButton()
              .setCustomId('deny_challenge')
              .setLabel('Deny')
              .setStyle('DANGER')
          );

        interaction.reply({ content: `${opponent}, you have been challenged by ${interaction.user.username}!`, components: [row] });

        const filter = i => i.customId === 'accept_challenge' || i.customId === 'deny_challenge';
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
          if (i.user.id !== opponentId) {
            return i.reply({ content: 'You cannot respond to this challenge.', ephemeral: true });
          }

          if (i.customId === 'accept_challenge') {
            await i.update({ content: `${interaction.user.username} and ${opponent.username} are now set to fight!`, components: [] });
            // Logic to record the fight
          } else if (i.customId === 'deny_challenge') {
            await i.update({ content: `${opponent.username} has denied the challenge.`, components: [] });
          }
        });

        collector.on('end', collected => {
          if (collected.size === 0) {
            interaction.editReply({ content: 'Challenge expired.', components: [] });
          }
        });
      });
    });
  },
};
