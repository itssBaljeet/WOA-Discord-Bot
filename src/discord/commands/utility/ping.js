const { SlashCommandBuilder } = require('discord.js');
const logError = require('../../../utils/logError');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		try{
			await interaction.reply('Pong!');
		} catch (error) {
			console.log(error);
			logError(error, interaction.commandName, interaction.user.username);
		}
	},
};
