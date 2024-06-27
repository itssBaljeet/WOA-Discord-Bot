const bot = require('../discord/bot')
const path = require('path')
const fs = require('fs')

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

