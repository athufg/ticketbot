const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder().setName('sendpanel').setDescription('Send ticket dropdown panel')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands('1391475230412898486'),
      { body: commands }
    );
    console.log('Commands registered.');
  } catch (err) {
    console.error(err);
  }
})();
