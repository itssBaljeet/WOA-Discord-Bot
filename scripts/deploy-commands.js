const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const { REST, Routes } = require('discord.js');
const fs = require('fs');

// Ensure token and IDs are present
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.SERVER_ID) {
  console.error('Missing required config values.');
  process.exit(1);
}

const commands = [];
const foldersPath = path.join(__dirname, '../src/discord/commands');
let commandFolders;

try {
  commandFolders = fs.readdirSync(foldersPath);
  console.log('Command folders read successfully');
} catch (err) {
  console.error('Error reading command folders:', err);
  process.exit(1);
}

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  let commandFiles;
  
  try {
    commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    console.log(`Reading command files from folder: ${folder}`);
  } catch (err) {
    console.error(`Error reading command files in folder ${folder}:`, err);
    continue;
  }
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`Loaded command: ${command.data.name}`);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Log commands array length
console.log(`Total commands loaded: ${commands.length}`);

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.SERVER_ID),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('Error deploying commands:', error);
  }
})();
