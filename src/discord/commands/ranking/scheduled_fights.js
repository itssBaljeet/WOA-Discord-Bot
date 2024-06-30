const { SlashCommandBuilder } = require('@discordjs/builders');
const { Fight, Fighter } = require('../../../../models');
const path = require('path');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scheduled_fights')
    .setDescription('Shows all currently scheduled fights'),
  async execute(interaction) {

    const configPath = path.join(__dirname, '../../../../extraResources/config.json');
    // const configPath = path.join(process.resourcesPath, 'config.json');
    let idConfig = JSON.parse(fs.readFileSync(configPath));

    // Checks if correct channel
    const channelId = idConfig.MAIN_TEXT_CHANNEL_ID;
    const channel = interaction.guild.channels.cache.get(channelId);
    const channelName = channel ? channel.name : 'the correct channel';
    if (interaction.channelId !== channelId) {
      return interaction.reply({ 
        content: `Please use this command in the correct channel: #${channelName}`, 
        ephemeral: true 
      });
    }

    try {
      const fights = await Fight.findAll({
        where: { status: 'accepted' },
      });
      if (fights.length === 0) {
        return interaction.reply('No fights are currently scheduled.');
      }

      let scheduledFightsInfo = 'Scheduled Fights:\n';
      for (const fight of fights) {
        const fighter1 = await Fighter.findByPk(fight.fighter1Id);
        const fighter2 = await Fighter.findByPk(fight.fighter2Id);

        if (!fighter1 || !fighter2) {
          scheduledFightsInfo += `--Fight ID: ${fight.id}--\n One or more fighters not found, Date: ${fight.fightDate ? fight.fightDate.toDateString() : 'Not scheduled yet'},Style: ${fight.combatStyle}\n`;
          continue;
        }

        scheduledFightsInfo += `--Fight ID: ${fight.id}--\n ${fighter1.name} vs ${fighter2.name}, Date: ${fight.fightDate ? fight.fightDate.toDateString() : 'Not scheduled yet'} Style: ${fight.combatStyle}\n`;
      }

      // Wrap the scheduled fights info in a code block
      scheduledFightsInfo = `\`\`\`\n${scheduledFightsInfo}\`\`\``;

      interaction.reply({ content: scheduledFightsInfo, ephemeral: true });
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while fetching scheduled fights.');
    }
  },
};
