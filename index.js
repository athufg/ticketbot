// Handle button interactions
if (interaction.isButton()) {
  const customId = interaction.customId;
  const action = customId.startsWith("buy") ? "buy" : "sell";
  const itemName = customId.replace(`${action}_`, "").replaceAll("_", " ");

  const modal = new ModalBuilder()
    .setCustomId(`${action}_modal_${customId.replace(`${action}_`, "")}`)
    .setTitle(`${action === "buy" ? "Buy" : "Sell"} Request - ${itemName}`);

  const itemInput = new TextInputBuilder()
    .setCustomId("item")
    .setLabel("Item(s)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const paymentInput = new TextInputBuilder()
    .setCustomId("payment")
    .setLabel("Payment Method")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const usernameInput = new TextInputBuilder()
    .setCustomId("username")
    .setLabel("Roblox Username")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const row1 = new ActionRowBuilder().addComponents(itemInput);
  const row2 = new ActionRowBuilder().addComponents(paymentInput);
  const row3 = new ActionRowBuilder().addComponents(usernameInput);

  modal.addComponents(row1, row2, row3);

  await interaction.showModal(modal);
}

// Handle modal submission
if (interaction.isModalSubmit()) {
  const action = interaction.customId.startsWith("buy") ? "buy" : "sell";

  const item = interaction.fields.getTextInputValue("item");
  const payment = interaction.fields.getTextInputValue("payment");
  const username = interaction.fields.getTextInputValue("username");

  const user = interaction.user;
  const guild = interaction.guild;

  const ticketChannel = await guild.channels.create({
    name: `ticket-${user.username}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: user.id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
      },
      {
        id: STAFF_ROLE_ID,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
      },
    ],
  });

  const embed = new EmbedBuilder()
    .setTitle(`🎫 New ${action.toUpperCase()} Ticket`)
    .setDescription(`**Item(s):** ${item}\n**Payment Method:** ${payment}\n**Roblox Username:** ${username}`)
    .setColor(action === "buy" ? "Green" : "Red")
    .setFooter({ text: `User: ${user.tag}`, iconURL: user.displayAvatarURL() });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("transcript_ticket").setLabel("Save Transcript").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("delete_ticket").setLabel("Delete Ticket").setStyle(ButtonStyle.Danger),
  );

  await ticketChannel.send({
    content: `<@${user.id}> <@&${STAFF_ROLE_ID}>`,
    embeds: [embed],
    components: [buttons],
  });

  await interaction.reply({
    content: `✅ Ticket created: ${ticketChannel}`,
    ephemeral: true,
  });
}
