const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createpanel2')
    .setDescription('Send the sell ticket panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = await interaction.client.channels.fetch('1399277644108791828');

    const embed = new EmbedBuilder()
      .setColor(0xffc107)
      .setTitle('🛒 Sell Panel')
      .setDescription('Click the button below to open a **Sell Ticket**.');

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('sell_ticket')
        .setLabel('🎫 Open Sell Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [embed], components: [button] });
    await interaction.reply({ content: '✅ Sell panel sent!', ephemeral: true });
  },
};
