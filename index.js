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
const EMBED_IMAGE = "https://cdn.discordapp.com/attachments/1391658230543028315/1391658281243508746/standard_8.gif?ex=688861c6&is=68871046&hm=f4b6efe814022c6481e7a0f5343e4404011562b871db614f219b2f3fffe35326&";

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (command === "$add") {
    const userId = args[0];
    const user = await message.guild.members.fetch(userId).catch(() => null);
    if (!user) return message.reply("❌ Invalid user ID.");

    await message.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
    });
    return message.reply(`✅ Added <@${user.id}> to this ticket.`);
  }

  if (command === "$remove") {
    const userId = args[0];
    const user = await message.guild.members.fetch(userId).catch(() => null);
    if (!user) return message.reply("❌ Invalid user ID.");

    await message.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: false,
    });
    return message.reply(`❌ Removed <@${user.id}> from this ticket.`);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "sendpanel" || interaction.commandName === "sendpanel2") {
      const isSell = interaction.commandName === "sendpanel2";

      const embed = new EmbedBuilder()
        .setTitle(`${isSell ? "📤 Sell" : "🛒 Buy"} Panel`)
        .setDescription(
          `${isSell ? "I am not buying Grow A Garden Pets\n" : ""}Choose an item from the dropdown below.`
        )
        .setColor(isSell ? 0xff5555 : 0x55ff55)
        .setThumbnail(EMBED_IMAGE);

      const menu = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(isSell ? "sell_da_hood" : "buy_da_hood")
          .setLabel(`${isSell ? "Sell" : "Buy"} Da Hood`)
          .setEmoji("<:DaHood:1321934745889669183>")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(isSell ? "sell_bladeball" : "buy_bladeball")
          .setLabel(`${isSell ? "Sell" : "Buy"} Bladeball`)
          .setEmoji("<:Bladeball:1289341370653479005>")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(isSell ? "sell_robux" : "buy_robux")
          .setLabel(`${isSell ? "Sell" : "Buy"} Robux`)
          .setEmoji("<:Robux:1328601212123349053>")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(isSell ? "sell_limiteds" : "buy_limiteds")
          .setLabel(`${isSell ? "Sell" : "Buy"} Limiteds`)
          .setEmoji("<:limiteds:1347882355653742612>")
          .setStyle(ButtonStyle.Primary),
        ...(!isSell
          ? [
              new ButtonBuilder()
                .setCustomId("buy_grow_a_garden")
                .setLabel("Buy Grow a Garden")
                .setEmoji("<:GAG:1397616856621256896>")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId("buy_adopt_me")
                .setLabel("Buy Adopt Me")
                .setEmoji("<:adoptme:1394233121519439902>")
                .setStyle(ButtonStyle.Primary),
            ]
          : [])
      );

      await interaction.reply({ content: "✅ Panel sent!", flags: 64 });
      await interaction.channel.send({ embeds: [embed], components: [menu] });
    }
  }

  if (interaction.isButton()) {
    const [action, ...itemParts] = interaction.customId.split("_");
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
        { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎫 New ${action.toUpperCase()} Ticket`)
      .setDescription(`**Item(s):** ${item}\n**Payment Method:** ${payment}\n**Roblox Username:** ${username}`)
      .setColor(action === "buy" ? 0x55ff55 : 0xff5555)
      .setThumbnail(EMBED_IMAGE)
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
      flags: 64,
    });
  }

  if (interaction.isButton()) {
    const { customId, channel } = interaction;

    if (customId === "close_ticket") {
      await channel.send("🔒 This ticket is now closed.");
    } else if (customId === "transcript_ticket") {
      await channel.send("📄 Transcript saved (placeholder). Work in progress.");
    } else if (customId === "delete_ticket") {
      await channel.send("⛔ Deleting this ticket in 3 seconds...");
      setTimeout(() => {
        channel.delete().catch(() => null);
      }, 3000);
    }
  }
});

client.login(process.env.TOKEN);
