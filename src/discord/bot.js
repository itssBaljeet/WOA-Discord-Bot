const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sequelize, Fighter, Fight, Admin } = require('../../models')

const configPath = path.join(__dirname, '../../extraResources/config.json');
// const configPath = path.join(process.resourcesPath, 'config.json');
let idConfig = JSON.parse(fs.readFileSync(configPath))

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,

  ],
});

sequelize.sync();

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set the client property on the command object
    command.client = client;
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

async function startBot() {
  try {
    await client.login(idConfig.DISCORD_TOKEN)
    console.log(`Logged in successfully as ${client.user.tag}!`)
  } catch(error) {
    console.log("Error logging in: ", error)
  }
}


client.once('ready', () => {
    console.log('Ready!');
});

module.exports = { client, startBot }