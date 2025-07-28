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

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "sendpanel" || interaction.commandName === "sendpanel2") {
      const isSell = interaction.commandName === "sendpanel2";

      const embed = new EmbedBuilder()
        .setTitle(`${isSell ? "📤 Sell Panel" : "🛒 Buy Panel"}`)
        .setDescription(
          `${isSell ? "Choose an item to sell from the dropdown below.\n\n**⚠️ I am not buying Grow A Garden Pets**" : "Choose an item to buy from the dropdown below."}`
        )
        .setColor(isSell ? 0xff0000 : 0x00ff00)
        .setThumbnail("https://cdn.discordapp.com/attachments/1391658230543028315/1391658281243508746/standard_8.gif");

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(isSell ? "sell_select" : "buy_select")
          .setPlaceholder(isSell ? "Select an item to sell" : "Select an item to buy")
          .addOptions(
            [
              {
                label: `${isSell ? "Sell" : "Buy"} Da Hood`,
                value: `${isSell ? "sell" : "buy"}_da_hood`,
                emoji: { id: "1321934745889669183" },
              },
              !isSell && {
                label: `${isSell ? "Sell" : "Buy"} Grow a Garden`,
                value: `${isSell ? "sell" : "buy"}_grow_a_garden`,
                emoji: { id: "1397616856621256896" },
              },
              {
                label: `${isSell ? "Sell" : "Buy"} Bladeball`,
                value: `${isSell ? "sell" : "buy"}_bladeball`,
                emoji: { id: "1289341370653479005" },
              },
              {
                label: `${isSell ? "Sell" : "Buy"} Robux`,
                value: `${isSell ? "sell" : "buy"}_robux`,
                emoji: { id: "1328601212123349053" },
              },
              {
                label: `${isSell ? "Sell" : "Buy"} Adopt Me`,
                value: `${isSell ? "sell" : "buy"}_adopt_me`,
                emoji: { id: "1394233121519439902" },
              },
              {
                label: `${isSell ? "Sell" : "Buy"} Limiteds`,
                value: `${isSell ? "sell" : "buy"}_limiteds`,
                emoji: { id: "1347882355653742612" },
              },
            ].filter(Boolean)
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
      .setColor(action === "buy" ? 0x00ff00 : 0xff0000)
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

  if (interaction.isButton()) {
    const channel = interaction.channel;

    if (interaction.customId === "close_ticket") {
      await channel.send("🔒 Ticket closed.");
      await channel.permissionOverwrites.edit(interaction.user.id, {
        SendMessages: false,
      });
      await interaction.reply({ content: "✅ Ticket closed.", ephemeral: true });
    }

    if (interaction.customId === "transcript_ticket") {
      await interaction.reply({ content: "📜 Transcript saved (mock).", ephemeral: true });
    }

    if (interaction.customId === "delete_ticket") {
      await interaction.reply({ content: "🗑️ Ticket will be deleted in 5 seconds.", ephemeral: true });
      setTimeout(() => {
        channel.delete().catch(console.error);
      }, 5000);
    }
  }
});

client.login(process.env.TOKEN);
