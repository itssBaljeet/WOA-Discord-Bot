const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter } = require('../../../models/index');
const logErrors = require('../../../utils/logError');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('manual_register')
    .setDescription('Register a new fighter manually')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to register')
        .setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');

    // Define the admin role ID (replace with your actual admin role ID)
    const adminRoleId = process.env.ADMIN_ROLE_ID;

    // Check if the user has the admin role
    if (!interaction.member.roles.cache.has(adminRoleId)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    try {
      // Check if the fighter is already registered
      const existingFighter = await Fighter.findOne({ where: { id: user.id } });
      if (existingFighter) {
        return interaction.reply({ content: `User ${user.tag} is already registered as a fighter.`, ephemeral: true });
      }

      // Register the new fighter
      await Fighter.create({
        id: user.id,
        name: user.username,
        wins: 0,
        losses: 0,
        hasSentChallenge: false,
        hasBeenChallenged: false,
      });

      return interaction.reply({ content: `User ${user.tag} has been registered as a fighter.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      logErrors(error, interaction.commandName, interaction.user.username);
      return interaction.reply({ content: 'An error occurred while registering the fighter.', ephemeral: true });
    }
  },
};
