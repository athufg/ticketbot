const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Bot is online!"));
app.listen(3000, () => console.log("Website running!"));

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
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

const STAFF_ROLE_ID = "1332256090993463306";
const LOG_CHANNEL_ID = "1343230007253925898";
const TRANSCRIPT_ROLE_ID = "1332256090993463306";
const OWNER_ID = "961956566939086858";
const WELCOME_CHANNEL_ID = "1341022339999207535";

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.GuildMemberAdd, async (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  const welcomeEmbed = new EmbedBuilder()
    .setColor("Blue")
    .setTitle("\uD83D\uDC4B Welcome!")
    .setDescription(
      `**Welcome! ${member} Thank you for joining <:excitedbear:1392001529065509005>**\n\n` +
      `**Make sure to invite your friends <a:beardance:1392001916476850267>**\n\n` +
      `**To buy or sell your skins go to <#1342421317068001372>**\n\n` +
      `**Hope you enjoy your stay <:bearheart:1392002056809611305>**`
    )
    .setImage("https://cdn.discordapp.com/attachments/1391658230543028315/1391995595409068122/standard_9.gif")
    .setTimestamp();

  channel.send({ embeds: [welcomeEmbed] });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "sendpanel2") {
      const embed = new EmbedBuilder()
        .setTitle("\uD83C\uDFCD\uFE0F SELLING PANEL")
        .setDescription("Click on the button corresponding to the type of ticket you wish to open!")
        .setColor("Orange")
        .setThumbnail("https://cdn.discordapp.com/attachments/1391658230543028315/1391658281243508746/standard_8.gif");

      const menu = new StringSelectMenuBuilder()
        .setCustomId("sell_menu")
        .setPlaceholder("Choose a Category to Sell")
        .addOptions([
          { label: "Sell Da Hood", value: "sell_da_hood", emoji: { id: "1333985399780933662" } },
          { label: "Sell Grow a Garden", value: "sell_grow_garden", emoji: { id: "1378896220969242726" } },
          { label: "Sell Bladeball", value: "sell_bladeball", emoji: { id: "1331369783370711101" } },
          { label: "Sell Limiteds", value: "sell_limiteds", emoji: { id: "1371211197713481748" } },
          { label: "Sell Adopt Me", value: "sell_adoptme", emoji: { id: "1299450168478797878" } },
          { label: "Sell Robux", value: "sell_robux", emoji: { id: "1380816043865538661" } },
        ]);

      const row = new ActionRowBuilder().addComponents(menu);
      await interaction.reply({ content: "✅ Selling Panel sent!", flags: 64 });
      await interaction.channel.send({ embeds: [embed], components: [row] });
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "sell_menu") {
      const value = interaction.values[0];
      const user = interaction.user;

      const labels = {
        sell_da_hood: "Skin(s) you want to sell?",
        sell_grow_garden: "What Grow a Garden Item(s) you want to sell?",
        sell_bladeball: "What Bladeball Item(s) you want to sell?",
        sell_limiteds: "Limited(s) you want to sell?",
        sell_adoptme: "Adopt Me Pet(s) you want to sell?",
        sell_robux: "Robux amount you want to sell?",
      };

      const modal = new ModalBuilder()
        .setCustomId(`sell_${value}_modal`)
        .setTitle(`Sell ${value.replace("sell_", "").replace(/_/g, " ")} Form`)
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
              .setLabel("Preferred Payment Method")
              .setStyle(TextInputStyle.Short)
              .setRequired(true),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("username")
              .setLabel("Your Roblox Username")
              .setStyle(TextInputStyle.Short)
              .setRequired(true),
          )
        );

      await interaction.showModal(modal);
    }
  }
});

client.login(process.env.TOKEN);
