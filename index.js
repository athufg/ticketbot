// 24/7 Web Server for UptimeRobot
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Bot is online!"));
app.listen(3000, () => console.log("Website running!"));

// Discord Bot Code
const {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
} = require("discord.js");
const fs = require("fs");
const PDFDocument = require("pdfkit");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const STAFF_ROLE_ID = "1332256090993463306";
const LOG_CHANNEL_ID = "1343230007253925898";
const TRANSCRIPT_ROLE_ID = "1332256090993463306";
const OWNER_ID = "961956566939086858";

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "sendpanel"
  ) {
    const embed = new EmbedBuilder()
      .setTitle("🛒 BUYING PANEL")
      .setDescription(
        "Click on the button corresponding to the type of ticket you wish to open!",
      )
      .setColor("Blue")
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/1391658230543028315/1391658281243508746/standard_8.gif",
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_menu")
      .setPlaceholder("Choose a Service..")
      .addOptions([
        {
          label: "Buy Da Hood",
          value: "da_hood",
          emoji: { id: "1333985399780933662" },
        },
        {
          label: "Buy Grow a Garden",
          value: "grow_garden",
          emoji: { id: "1378896220969242726" },
        },
        {
          label: "Buy Bladeball",
          value: "bladeball",
          emoji: { id: "1331369783370711101" },
        },
        {
          label: "Buy Limiteds",
          value: "limiteds",
          emoji: { id: "1371211197713481748" },
        },
        {
          label: "Buy Adopt Me",
          value: "adoptme",
          emoji: { id: "1299450168478797878" },
        },
        {
          label: "Buy Robux",
          value: "robux",
          emoji: { id: "1380816043865538661" },
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    await interaction.reply({ content: "✅ Panel sent!", flags: 64 });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  }

  if (interaction.isStringSelectMenu()) {
    const value = interaction.values[0];
    const user = interaction.user;

    const labels = {
      da_hood: "Skin(s) you want to buy?",
      grow_garden: "What Grow a Garden Item(s) You Want to buy?",
      bladeball: "What Bladeball Item(s) You Want to buy?",
      limiteds: "Limited(s) you want to buy?",
      adoptme: "Adopt Me Pet(s) you want to buy?",
      robux: "Robux you want to buy?",
    };

    const modal = new ModalBuilder()
      .setCustomId(`buy_${value}_modal`)
      .setTitle(`Buy ${value.replace(/_/g, " ")} Order Form`)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("item")
            .setLabel(labels[value])
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("payment")
            .setLabel("Payment Method")
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("username")
            .setLabel("Your Roblox Username")
            .setStyle(TextInputStyle.Short)
            .setRequired(true),
        ),
      );

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit()) {
    const type = interaction.customId.split("_")[1];
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
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
          ],
        },
        {
          id: STAFF_ROLE_ID,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
          ],
        },
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎫 New ${type} Ticket`)
      .setDescription(
        `**Item(s):** ${item}\n**Payment Method:** ${payment}\n**Roblox Username:** ${username}`,
      )
      .setColor("Green")
      .setFooter({
        text: `User: ${user.tag}`,
        iconURL: user.displayAvatarURL(),
      });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("transcript_ticket")
        .setLabel("Save Transcript")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("delete_ticket")
        .setLabel("Delete Ticket")
        .setStyle(ButtonStyle.Danger),
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
      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { ViewChannel: false },
      );
      await channel.permissionOverwrites.edit(interaction.user.id, {
        ViewChannel: false,
      });
      await channel.send(`🔒 ${interaction.user.tag} has closed the ticket.`);
      await interaction.reply({
        content: "🔒 Ticket closed successfully.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.customId === "delete_ticket") {
      if (interaction.user.id !== OWNER_ID) {
        return interaction.reply({
          content: "⛔ Only the server owner can delete tickets.",
          ephemeral: true,
        });
      }
      await interaction.reply({
        content: "⛔ Ticket will be permanently deleted in 5 seconds...",
      });
      setTimeout(() => channel.delete().catch(() => {}), 5000);
      return;
    }

    if (interaction.customId === "transcript_ticket") {
      if (!interaction.member.roles.cache.has(TRANSCRIPT_ROLE_ID)) {
        return interaction.reply({
          content: "⛔ You do not have permission to generate transcripts.",
          ephemeral: true,
        });
      }
      const messages = await channel.messages.fetch({ limit: 100 });
      const sorted = messages.sort(
        (a, b) => a.createdTimestamp - b.createdTimestamp,
      );
      const fileName = `transcript-${channel.name}.pdf`;
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(fileName);
      doc.pipe(stream);

      doc
        .fontSize(18)
        .text(`Transcript for ${channel.name}`, { underline: true });
      doc.moveDown();

      sorted.forEach((msg) => {
        const timestamp = new Date(msg.createdTimestamp).toLocaleString();
        doc
          .fontSize(12)
          .text(`[${timestamp}] ${msg.author.tag}: ${msg.content}`);
      });

      doc.end();

      stream.on("finish", async () => {
        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel) {
          await logChannel.send({
            content: `📄 Transcript for ${channel.name}`,
            files: [fileName],
          });
        }
        await interaction.reply({
          content: "📄 Transcript sent to the log channel.",
          ephemeral: true,
        });
        setTimeout(() => fs.unlinkSync(fileName), 10000);
      });
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.channel.name.startsWith("ticket-")) return;

  if (message.content === "$close") {
    await message.channel.permissionOverwrites.edit(
      message.guild.roles.everyone,
      { ViewChannel: false },
    );
    await message.channel.permissionOverwrites.edit(message.author.id, {
      ViewChannel: false,
    });
    await message.channel.send(
      `🔒 ${message.author.tag} has closed the ticket using command.`,
    );
  }

  if (message.content === "$delete") {
    if (message.author.id !== OWNER_ID) {
      return message.reply("⛔ Only the server owner can delete tickets.");
    }
    await message.channel.send(
      "⛔ Ticket will be permanently deleted in 5 seconds...",
    );
    setTimeout(() => message.channel.delete().catch(() => {}), 5000);
  }
});

client.login(process.env.TOKEN);
