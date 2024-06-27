const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter } = require('../../../../models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register as a fighter'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const userName = interaction.user.username;

    try {
      const fighter = await Fighter.findByPk(userId);
      if (fighter) {
        return interaction.reply('You are already registered.');
      }

      await Fighter.create({ id: userId, name: userName, rank: 1 });
      interaction.reply(`You have been registered as a fighter, ${userName}!`);
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while trying to register.');
    }
  },
};
