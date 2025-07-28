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
        .setDescription(
          `${isSell ? "I am not buying Grow A Garden Pets\n\n" : ""}Choose an item from the dropdown below.`
        )
        .setColor(isSell ? 0xff3c3c : 0x3cff70)
        .setThumbnail("https://cdn.discordapp.com/attachments/1391658230543028315/1391658281243508746/standard_8.gif");

      const options = [
        {
          label: `${isSell ? "Sell" : "Buy"} Da Hood`,
          value: `${isSell ? "sell" : "buy"}_da_hood`,
          emoji: "<:DaHood:1321934745889669183>"
        },
        {
          label: `${isSell ? "Sell" : "Buy"} Blade Ball`,
          value: `${isSell ? "sell" : "buy"}_bladeball`,
          emoji: "<:Bladeball:1289341370653479005>"
        },
        {
          label: `${isSell ? "Sell" : "Buy"} Robux`,
          value: `${isSell ? "sell" : "buy"}_robux`,
          emoji: "<:Robux:1328601212123349053>"
        },
        {
          label: `${isSell ? "Sell" : "Buy"} Adopt Me`,
          value: `${isSell ? "sell" : "buy"}_adopt_me`,
          emoji: "<:adoptme:1394233121519439902>"
        },
        {
          label: `${isSell ? "Sell" : "Buy"} Limiteds`,
          value: `${isSell ? "sell" : "buy"}_limiteds`,
          emoji: "<:limiteds:1347882355653742612>"
        },
      ];

      if (!isSell) {
        options.splice(1, 0, {
          label: "Buy Grow a Garden",
          value: "buy_grow_a_garden",
          emoji: "<:GAG:1397616856621256896>"
        });
      }

      const select = new ActionRowBuilder().addComponents(
        new (require("discord.js")).StringSelectMenuBuilder()
          .setCustomId("select_game")
          .setPlaceholder("Choose a game")
          .addOptions(options)
      );

      await interaction.reply({ content: "✅ Panel sent!", ephemeral: true });
      await interaction.channel.send({ embeds: [embed], components: [select] });
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

    const row1 = new ActionRowBuilder().addComponents(itemInput);
    const row2 = new ActionRowBuilder().addComponents(paymentInput);
    const row3 = new ActionRowBuilder().addComponents(usernameInput);

    modal.addComponents(row1, row2, row3);

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
      .setColor(action === "buy" ? 0x3cff70 : 0xff3c3c)
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

  if (interaction.isButton()) {
    const channel = interaction.channel;
    if (!channel.name.startsWith("ticket-")) return;

    if (interaction.customId === "close_ticket") {
      await interaction.reply({ content: "🔒 Ticket closed.", ephemeral: true });
      await channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: false });
    }

    if (interaction.customId === "transcript_ticket") {
      await interaction.reply({ content: "📄 Transcript saved (not implemented).", ephemeral: true });
      // Add actual transcript logic here if needed
    }

    if (interaction.customId === "delete_ticket") {
      await interaction.reply({ content: "🗑️ Ticket will be deleted in 5 seconds.", ephemeral: true });
      setTimeout(() => channel.delete(), 5000);
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith("$")) return;

  const [command, arg] = message.content.trim().split(/\s+/);
  const ticketPrefix = "ticket-";

  if (!message.channel.name || !message.channel.name.startsWith(ticketPrefix)) {
    return message.reply("❌ You can only use this command inside a ticket channel.");
  }

  if (!arg || !/^\d{17,19}$/.test(arg)) {
    return message.reply("❌ Please provide a valid user ID.");
  }

  const userId = arg;

  if (command === "$add") {
    await message.channel.permissionOverwrites.edit(userId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });
    return message.reply(`✅ <@${userId}> has been added to this ticket.`);
  }

  if (command === "$remove") {
    await message.channel.permissionOverwrites.edit(userId, {
      ViewChannel: false,
    });
    return message.reply(`✅ <@${userId}> has been removed from this ticket.`);
  }
});

client.login(process.env.TOKEN);
