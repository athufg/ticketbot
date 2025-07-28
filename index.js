require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const STAFF_ROLE_ID = "YOUR_STAFF_ROLE_ID"; // replace with your actual staff role ID

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "sendpanel" || interaction.commandName === "sendpanel2") {
      const isSell = interaction.commandName === "sendpanel2";

      const embed = new EmbedBuilder()
        .setTitle(`${isSell ? "📤 Sell" : "🛒 Buy"} Panel`)
        .setDescription("Choose an item from the dropdown below.")
        .setColor(isSell ? "Red" : "Green");

      const menu = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(isSell ? "sell_da_hood" : "buy_da_hood")
          .setLabel(`${isSell ? "Sell" : "Buy"} Da Hood`)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(isSell ? "sell_grow_a_garden" : "buy_grow_a_garden")
          .setLabel(`${isSell ? "Sell" : "Buy"} Grow a Garden`)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(isSell ? "sell_bladeball" : "buy_bladeball")
          .setLabel(`${isSell ? "Sell" : "Buy"} Bladeball`)
          .setStyle(ButtonStyle.Primary),
      );

      await interaction.reply({ content: "✅ Panel sent!", ephemeral: true });
      await interaction.channel.send({ embeds: [embed], components: [menu] });
    }
  }

  // Handle button interactions
  if (interaction.isButton()) {
    const [action, ...itemParts] = interaction.customId.split("_"); // "buy", "da", "hood"
    const itemName = itemParts.join(" ");

    const modal = new ModalBuilder()
      .setCustomId(`${action}_${itemParts.join("_")}_modal`)
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
    const [action] = interaction.customId.split("_"); // "buy" or "sell"
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
});

client.login(process.env.TOKEN);
