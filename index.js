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

const STAFF_ROLE_ID = "1332256090993463306";

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
          `${isSell ? "Select the item you want to sell." : "Select the item you want to buy."}${
            isSell ? "\n\n❗ I am not buying Grow A Garden Pets" : ""
          }`
        )
        .setColor(isSell ? "Red" : "Green")
        .setThumbnail(
          "https://cdn.discordapp.com/attachments/1391658230543028315/1391658281243508746/standard_8.gif"
        );

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(isSell ? "sell_select" : "buy_select")
          .setPlaceholder(isSell ? "Select item to sell" : "Select item to buy")
          .addOptions(
            !isSell
              ? [
                  {
                    label: "Da Hood",
                    value: "buy_da_hood",
                    emoji: "<:DaHood:1321934745889669183>",
                  },
                  {
                    label: "Grow a Garden",
                    value: "buy_grow_a_garden",
                    emoji: "<:GAG:1397616856621256896>",
                  },
                  {
                    label: "Bladeball",
                    value: "buy_bladeball",
                    emoji: "<:Bladeball:1289341370653479005>",
                  },
                  {
                    label: "Robux",
                    value: "buy_robux",
                    emoji: "<:Robux:1328601212123349053>",
                  },
                  {
                    label: "Adopt Me",
                    value: "buy_adopt",
                    emoji: "<:adoptme:1394233121519439902>",
                  },
                  {
                    label: "Limiteds",
                    value: "buy_limiteds",
                    emoji: "<:limiteds:1347882355653742612>",
                  },
                ]
              : [
                  {
                    label: "Da Hood",
                    value: "sell_da_hood",
                    emoji: "<:DaHood:1321934745889669183>",
                  },
                  {
                    label: "Bladeball",
                    value: "sell_bladeball",
                    emoji: "<:Bladeball:1289341370653479005>",
                  },
                  {
                    label: "Robux",
                    value: "sell_robux",
                    emoji: "<:Robux:1328601212123349053>",
                  },
                  {
                    label: "Adopt Me",
                    value: "sell_adopt",
                    emoji: "<:adoptme:1394233121519439902>",
                  },
                  {
                    label: "Limiteds",
                    value: "sell_limiteds",
                    emoji: "<:limiteds:1347882355653742612>",
                  },
                ]
          )
      );

      await interaction.reply({ content: "✅ Panel sent!", flags: 64 });
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

    await interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, flags: 64 });
  }

  // Handle ticket buttons
  if (interaction.isButton()) {
    const id = interaction.customId;
    if (id === "close_ticket") {
      await interaction.reply({ content: "✅ Ticket closed.", flags: 64 });
      await interaction.channel.send("Ticket is now closed by a staff member.");
    } else if (id === "transcript_ticket") {
      await interaction.reply({ content: "📜 Transcript feature coming soon.", flags: 64 });
    } else if (id === "delete_ticket") {
      try {
        await interaction.reply({ content: "🗑️ Deleting ticket...", flags: 64 });
        await interaction.channel.delete();
      } catch (error) {
        if (error.code === 10003) {
          await interaction.reply({ content: "❌ Channel already deleted.", flags: 64 });
        } else {
          console.error("Error deleting channel:", error);
          await interaction.reply({ content: "❌ An error occurred while deleting the channel.", flags: 64 });
        }
      }
    }
  }
});

client.login(process.env.TOKEN);
