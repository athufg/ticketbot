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
  StringSelectMenuBuilder,
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

const STAFF_ROLE_ID = "1332256090993463306"; // replace with your actual staff role ID

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "sendpanel" || interaction.commandName === "sendpanel2") {
      const isSell = interaction.commandName === "sendpanel2";

      const embed = new EmbedBuilder()
        .setTitle(`${isSell ? "📤 Sell" : "🛒 Buy"} Panel`)
        .setDescription("Select an item below to proceed.")
        .setColor("#2F3136")
        .setImage("https://cdn.discordapp.com/attachments/1391658230543028315/1391658281243508746/standard_8.gif")
        .setFooter({ text: "Please make a selection to create a ticket." });

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(isSell ? "sell_menu" : "buy_menu")
          .setPlaceholder(`Select an item to ${isSell ? "sell" : "buy"}`)
          .addOptions(
            {
              label: `${isSell ? "Sell" : "Buy"} Da Hood`,
              value: `${isSell ? "sell_da_hood" : "buy_da_hood"}`,
              emoji: { name: "DaHood", id: "1321934745889669183" },
            },
            {
              label: `${isSell ? "Sell" : "Buy"} Grow a Garden`,
              value: `${isSell ? "sell_grow_a_garden" : "buy_grow_a_garden"}`,
              emoji: "🌱",
            },
            {
              label: `${isSell ? "Sell" : "Buy"} Bladeball`,
              value: `${isSell ? "sell_bladeball" : "buy_bladeball"}`,
              emoji: { name: "Bladeball", id: "1289341370653479005" },
            },
            {
              label: `${isSell ? "Sell" : "Buy"} Robux`,
              value: `${isSell ? "sell_robux" : "buy_robux"}`,
              emoji: { name: "Robux", id: "1328601212123349053" },
            },
            {
              label: `${isSell ? "Sell" : "Buy"} Adopt Me`,
              value: `${isSell ? "sell_adopt_me" : "buy_adopt_me"}`,
              emoji: { name: "adoptme", id: "1394233121519439902" },
            },
            {
              label: `${isSell ? "Sell" : "Buy"} Limiteds`,
              value: `${isSell ? "sell_limiteds" : "buy_limiteds"}`,
              emoji: { name: "limiteds", id: "1347882355653742612" },
            }
          )
      );

      await interaction.reply({ content: "✅ Panel sent!", ephemeral: true });
      await interaction.channel.send({ embeds: [embed], components: [menu] });
    }
  }

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

  if (interaction.isModalSubmit()) {
    const [action] = interaction.customId.split("_");
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
