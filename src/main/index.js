const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const bot = require('../discord/bot')
const fs = require('fs')
const logError = require('../utils/logError');

try {
	bot.startBot();

	bot.client.on('ready', () => {
	  const eventsPath = path.join(__dirname, '../discord/events');
	  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
	  
	  for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		const event = require(filePath);
		console.log('Loading event:', event.name);
		if (event.once) {
		  bot.client.once(event.name, (...args) => event.execute(...args));
		} else {
		  bot.client.on(event.name, (...args) => event.execute(...args));
		}
	  }
	})
} catch (error) {
	console.log('There was an error starting the bot: ', error);
	logError(error, 'init bot at index.js');
}
