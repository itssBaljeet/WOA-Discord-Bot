const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register as a fighter'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const userName = interaction.user.username;

    const db = interaction.client.db; // Assuming you've attached the db to the client object

    db.get(`SELECT * FROM fighters WHERE id = ?`, [userId], (err, row) => {
      if (err) {
        console.error(err.message);
        return interaction.reply('An error occurred while trying to register.');
      }
      if (row) {
        return interaction.reply('You are already registered.');
      } else {
        db.run(`INSERT INTO fighters (id, name, rank) VALUES (?, ?, ?)`, [userId, userName, 1], function(err) {
          if (err) {
            console.error(err.message);
            return interaction.reply('An error occurred while trying to register.');
          }
          interaction.reply(`You have been registered as a fighter, ${userName}!`);
        });
      }
    });
  },
};
