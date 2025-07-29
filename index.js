// index.js

const { Client, GatewayIntentBits, Partials, Routes, REST, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require("discord.js");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const LOG_CHANNEL_ID = "1343230007253925898";
const DELETE_ROLE_ID = "1332256090993463306";

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Commands
const commands = [
  {
    name: "sendpanel",
    description: "Send ticket panel (Buy)",
  },
  {
    name: "sendpanel2",
    description: "Send ticket panel (Sell)",
  },
];

const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    console.log("Registering slash commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("Slash commands registered.");
  } catch (err) {
    console.error(err);
  }
})();

// Welcome message
function getWelcomeEmbed(member) {
  return new EmbedBuilder()
    .setColor("Blurple")
    .setTitle("Welcome!")
    .setDescription(`**Welcome! ${member} Thank you for joining <:bearexcite:1300001647510032415>**  
Make sure to invite your friends <a:fs_dance:1281706715342966784>  
To buy or sell your skins go to <#1342421317068001372>  
**Hope you enjoy your stay <:milkheart:1298848334642937931>**`)
    .setImage("https://cdn.discordapp.com/attachments/1391658230543028315/1391995595409068122/standard_9.gif");
}

// Dropdown menu
function createSelectMenu(isBuy = true) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(isBuy ? "buy-options" : "sell-options")
      .setPlaceholder(isBuy ? "Select Buy Option" : "Select Sell Option")
      .addOptions(
        { label: "Da Hood Skins", value: "dahood" },
        { label: "MM2 Items", value: "mm2" },
        { label: "Adopt Me Items", value: "adoptme" },
        { label: "Please Donate Items", value: "pls" },
        { label: "T-Shirts", value: "tshirts" },
        ...(isBuy ? [{ label: "Grow a Garden", value: "garden" }] : [])
      )
  );
}

// Panel Command
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "sendpanel" || interaction.commandName === "sendpanel2") {
    const isBuy = interaction.commandName === "sendpanel";
    const embed = new EmbedBuilder()
      .setTitle(isBuy ? "Buy da hood Skins" : "Sell da hood Skins")
      .setColor("Green")
      .setDescription("Select a category from the dropdown below.");

    const row = createSelectMenu(isBuy);
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
});

// Dropdown → Modal
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  const modal = new ModalBuilder()
    .setCustomId("order-form")
    .setTitle(interaction.customId.startsWith("buy") ? "Buy da hood Order Form" : "Sell da hood Form")
    .addComponents(
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("item").setLabel("Skin(s) / Item(s)").setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("payment").setLabel("Payment Method").setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("username").setLabel("Your Roblox Username").setStyle(TextInputStyle.Short).setRequired(true))
    );

  await interaction.showModal(modal);
});

// Modal Submit
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "order-form") return;

  const item = interaction.fields.getTextInputValue("item");
  const payment = interaction.fields.getTextInputValue("payment");
  const username = interaction.fields.getTextInputValue("username");

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: client.user.id,
        allow: [PermissionFlagsBits.ViewChannel],
      },
    ],
  });

  const embed = new EmbedBuilder()
    .setTitle("📄 New da Ticket")
    .setDescription(`**Item(s):** ${item}\n**Payment Method:** ${payment}\n**Roblox Username:** ${username}`)
    .setFooter({ text: `User: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

  const welcomeEmbed = getWelcomeEmbed(interaction.user);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("close").setLabel("Close Ticket").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("transcript").setLabel("Save Transcript").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("delete").setLabel("Delete Ticket").setStyle(ButtonStyle.Danger)
  );

  await channel.send({ content: `${interaction.user}`, embeds: [welcomeEmbed, embed], components: [row] });
  await interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
});

// Button Interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const channel = interaction.channel;

  if (interaction.customId === "close") {
    await channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: false });
    await interaction.reply({ content: "You have been removed from the ticket.", ephemeral: true });
  }

  if (interaction.customId === "delete") {
    if (!interaction.member.roles.cache.has(DELETE_ROLE_ID)) {
      return interaction.reply({ content: "You don't have permission to delete this ticket.", ephemeral: true });
    }
    await interaction.reply({ content: "Deleting ticket...", ephemeral: true });
    setTimeout(() => channel.delete().catch(() => {}), 3000);
  }

  if (interaction.customId === "transcript") {
    if (!interaction.member.roles.cache.has(DELETE_ROLE_ID)) {
      return interaction.reply({ content: "Only staff can generate transcript.", ephemeral: true });
    }

    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = [...messages.values()].reverse();
    const doc = new PDFDocument();
    const filePath = `./transcript-${channel.id}.pdf`;
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    sorted.forEach((m) => {
      doc.text(`${m.author.tag}: ${m.content}`);
    });

    doc.end();
    writeStream.on("finish", async () => {
      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
      await logChannel.send({ content: `Transcript from ${channel.name}`, files: [filePath] });
      fs.unlinkSync(filePath);
    });

    await interaction.reply({ content: "Transcript saved and sent to logs.", ephemeral: true });
  }
});

// Express keep-alive
const app = express();
app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(3000, () => console.log("Express server running"));

client.login(TOKEN);
