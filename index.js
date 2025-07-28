require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const STAFF_ROLE_ID = "1332256090993463306"; // replace with your actual staff role ID
const PANEL_IMAGE_URL = "https://cdn.discordapp.com/attachments/1391658230543028315/1391658281243508746/standard_8.gif?ex=688861c6&is=68871046&hm=f4b6efe814022c6481e7a0f5343e4404011562b871db614f219b2f3fffe35326&"; // <-- Use your previous image or replace with a new one

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // Slash Command Handler
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "sendpanel" || interaction.commandName === "sendpanel2") {
      const isSell = interaction.commandName === "sendpanel2";

      const embed = new EmbedBuilder()
        .setTitle(`${isSell ? "📤 Sell" : "🛒 Buy"} Panel`)
        .setDescription("Select a game from the dropdown below to open a ticket.")
        .setColor(isSell ? "Red" : "Green")
        .setThumbnail(PANEL_IMAGE_URL); // ✅ Adds image to the side

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(isSell ? "sell_menu" : "buy_menu")
          .setPlaceholder(`Select a game to ${isSell ? "sell" : "buy"}`)
          .addOptions(
            {
              label: `${isSell ? "Sell" : "Buy"} Da Hood`,
              value: isSell ? "sell_da_hood" : "buy_da_hood",
            },
            {
              label: `${isSell ? "Sell" : "Buy"} Grow a Garden`,
              value: isSell ? "sell_grow_a_garden" : "buy_grow_a_garden",
            },
            {
              label: `${isSell ? "Sell" : "Buy"} Bladeball`,
              value: isSell ? "sell_bladeball" : "buy_bladeball",
            }
          )
      );

      await interaction.reply({ content: "✅ Panel sent!", ephemeral: true });
      await interaction.channel.send({ embeds: [embed], components: [menu] });
    }
  }

  // Dropdown handler
  if (interaction.isStringSelectMenu()) {
    const [action, ...itemParts] = interaction.values[0].split("_");
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

  // Modal submission
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
      new ButtonBuilder().setCustomId("delete_ticket").setLabel("Delete Ticket").setStyle(ButtonStyle.Danger)
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
