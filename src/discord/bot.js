const { Client, Collection, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { sequelize, Fighter, Fight, Admin } = require('../../models')
const logError = require('../../utils/logError');

const configPath = path.join(__dirname, '../../extraResources/config.json');
let idConfig = JSON.parse(fs.readFileSync(configPath))

// Client obj with intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,

  ],
});

// Sync database
sequelize.sync();

// Load commands
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

// Start monthly removal job of challenge limit when ready
client.once('ready', () => {
    console.log('Ready!');
    cron.schedule('0 0 1 * *', async () => {
      try {
        await Fighter.update(
          { hasSentChallenge: false, hasBeenChallenged: false },
          { where: {} }
        );
        console.log('Successfully reset challenge statuses for all fighters.');
      } catch (error) {
        console.error('Error resetting challenge statuses:', error);
      }
    });

	// Backup database at the beginning of each month
	cron.schedule('0 0 1 * *', () => {
		const dbPath = path.join(__dirname, '../../db/database.sqlite'); // Adjust the path as necessary
		const backupDir = path.join(__dirname, '../../db');
		const backupFiles = fs.readdirSync(backupDir).filter(file => file.startsWith('backup-database-'));
	
		// Delete the oldest backup if there are more than 3 backups
		if (backupFiles.length >= 3) {
		  const oldestBackup = backupFiles.sort()[0];
		  fs.unlinkSync(path.join(backupDir, oldestBackup));
		  console.log('Deleted oldest backup:', oldestBackup);
		}
	
		const backupPath = path.join(backupDir, `backup-database-${new Date().toISOString().split('T')[0]}.sqlite`);
		fs.copyFile(dbPath, backupPath, (err) => {
		  if (err) {
			console.error('Error backing up database:', err);
			logError(err);
		  } else {
			console.log('Database backup created successfully:', backupPath);
		  }
		});
	});
});

module.exports = { client, startBot }