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
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
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
        .setColor("#ED75DC")
        .setImage("https://cdn.discordapp.com/attachments/1391658230543028315/1391658281243508746/standard_8.gif?ex=688861c6&is=68871046&hm=f4b6efe814022c6481e7a0f5343e4404011562b871db614f219b2f3fffe35326&");

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(isSell ? "sell_menu" : "buy_menu")
          .setPlaceholder(`Select an item to ${isSell ? "sell" : "buy"}`)
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel("Da Hood").setValue(`${isSell ? "sell" : "buy"}_da_hood`).setEmoji("🧨"),
            new StringSelectMenuOptionBuilder().setLabel("Grow a Garden").setValue(`${isSell ? "sell" : "buy"}_grow_a_garden`).setEmoji("🌱"),
            new StringSelectMenuOptionBuilder().setLabel("Bladeball").setValue(`${isSell ? "sell" : "buy"}_bladeball`).setEmoji("⚔️"),
            new StringSelectMenuOptionBuilder().setLabel("Robux").setValue(`${isSell ? "sell" : "buy"}_robux`).setEmoji("💸"),
            new StringSelectMenuOptionBuilder().setLabel("Adopt Me").setValue(`${isSell ? "sell" : "buy"}_adopt_me`).setEmoji("🍼"),
            new StringSelectMenuOptionBuilder().setLabel("Limiteds").setValue(`${isSell ? "sell" : "buy"}_limiteds`).setEmoji("💎")
          )
      );

      await interaction.reply({ content: "✅ Panel sent!", ephemeral: true });
      await interaction.channel.send({ embeds: [embed], components: [menu] });
    }
  }

  // Handle select menu interactions
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

    modal.addComponents(
      new ActionRowBuilder().addComponents(itemInput),
      new ActionRowBuilder().addComponents(paymentInput),
      new ActionRowBuilder().addComponents(usernameInput)
    );

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

  // Handle ticket button actions
  if (interaction.isButton()) {
    const channel = interaction.channel;
    if (interaction.customId === "close_ticket") {
      await channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: false });
      await interaction.reply({ content: "🔒 Ticket closed.", ephemeral: true });
    } else if (interaction.customId === "delete_ticket") {
      await interaction.reply({ content: "🗑️ Deleting ticket in 5 seconds...", ephemeral: true });
      setTimeout(() => channel.delete().catch(() => {}), 5000);
    } else if (interaction.customId === "transcript_ticket") {
      await interaction.reply({ content: "📄 Transcript saved! (Feature coming soon)", ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
