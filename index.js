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
  AttachmentBuilder,
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
        .setDescription("Choose an item from the dropdown below.")
        .setColor(isSell ? 0xff3c3c : 0x00ffab)
        .setImage("https://cdn.discordapp.com/attachments/1391658230543028315/1391658281243508746/standard_8.gif");

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(isSell ? "sell_menu" : "buy_menu")
          .setPlaceholder(`Select an item to ${isSell ? "sell" : "buy"}`)
          .addOptions([
            new StringSelectMenuOptionBuilder().setLabel(`${isSell ? "Sell" : "Buy"} Da Hood`).setValue(`${isSell ? "sell" : "buy"}_da_hood`).setEmoji("<:DaHood:1321934745889669183>"),
            new StringSelectMenuOptionBuilder().setLabel(`${isSell ? "Sell" : "Buy"} Grow a Garden`).setValue(`${isSell ? "sell" : "buy"}_grow_a_garden`).setEmoji("<:GAG:1397616856621256896>"),
            new StringSelectMenuOptionBuilder().setLabel(`${isSell ? "Sell" : "Buy"} Bladeball`).setValue(`${isSell ? "sell" : "buy"}_bladeball`).setEmoji("<:Bladeball:1289341370653479005>"),
            new StringSelectMenuOptionBuilder().setLabel(`${isSell ? "Sell" : "Buy"} Robux`).setValue(`${isSell ? "sell" : "buy"}_robux`).setEmoji("<:Robux:1328601212123349053>"),
            new StringSelectMenuOptionBuilder().setLabel(`${isSell ? "Sell" : "Buy"} Adopt Me`).setValue(`${isSell ? "sell" : "buy"}_adopt_me`).setEmoji("<:adoptme:1394233121519439902>"),
            new StringSelectMenuOptionBuilder().setLabel(`${isSell ? "Sell" : "Buy"} Limiteds`).setValue(`${isSell ? "sell" : "buy"}_limiteds`).setEmoji("<:limiteds:1347882355653742612>")
          ])
      );

      await interaction.reply({ content: "✅ Panel sent!", ephemeral: true });
      await interaction.channel.send({ embeds: [embed], components: [menu] });
    }
  }

  // Handle dropdown selection
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
      .setColor(action === "buy" ? 0x00ffab : 0xff3c3c)
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

  // Handle button functions
  if (interaction.isButton()) {
    const { customId } = interaction;
    const channel = interaction.channel;

    if (customId === "close_ticket") {
      await channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: false });
      await interaction.reply({ content: "🔒 Ticket closed.", ephemeral: true });
    }

    if (customId === "delete_ticket") {
      await interaction.reply({ content: "🗑️ Ticket will be deleted in 5 seconds.", ephemeral: true });
      setTimeout(() => channel.delete(), 5000);
    }

    if (customId === "transcript_ticket") {
      const messages = await channel.messages.fetch({ limit: 100 });
      const transcript = messages.reverse().map(m => `${m.author.tag}: ${m.content}`).join("\n");
      const file = new AttachmentBuilder(Buffer.from(transcript), { name: `transcript-${channel.name}.txt` });

      await interaction.reply({
        content: "📄 Transcript saved.",
        files: [file],
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
