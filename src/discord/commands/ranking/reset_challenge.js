const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fighter } = require('../../../models/index.js');
const logError = require('../../../utils/logError.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset_challenges')
    .setDescription('Reset a fighter\'s challenge status')
    .addUserOption(option => 
      option.setName('fighter')
        .setDescription('The fighter to reset')
        .setRequired(true)),
  async execute(interaction) {
    const fighterUser = interaction.options.getUser('fighter');
    const fighterId = fighterUser.id;
    const adminRoleId = process.env.ADMIN_ROLE_ID; // Ensure this is set in your environment variables

    // Check if the user has the admin role
    if (!interaction.member.roles.cache.has(adminRoleId)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    try {
      const fighter = await Fighter.findByPk(fighterId);

      if (!fighter) {
        return interaction.reply({ content: 'Fighter not found.', ephemeral: true });
      }

      await fighter.update({ hasSentChallenge: false, hasBeenChallenged: false });

      return interaction.reply({ content: `Challenge status for ${fighterUser.tag} has been reset.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      logError(error, interaction.commandName, interaction.user.username);
      return interaction.reply({ content: 'An error occurred while resetting the challenge status.', ephemeral: true });
    }
  },
};
