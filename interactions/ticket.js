module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'sell_ticket') {
      const channel = await interaction.guild.channels.create({
        name: `sell-${interaction.user.username}`,
        type: 0,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: ['ViewChannel'],
          },
          {
            id: interaction.user.id,
            allow: ['ViewChannel', 'SendMessages', 'AttachFiles'],
          },
        ],
      });

      await channel.send(`Hello ${interaction.user}, a staff member will assist you with your sale soon!`);
      await interaction.reply({ content: `✅ Your sell ticket has been created: ${channel}`, ephemeral: true });
    }
  },
};
