const {
  Client, GatewayIntentBits, Partials, Collection, Events,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
  PermissionsBitField
} = require('discord.js');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

client.once(Events.ClientReady, () => {
  console.log(`Bot is ready as ${client.user.tag}`);
});

// ========== WELCOME MESSAGE ==========
client.on(Events.GuildMemberAdd, async member => {
  const channel = member.guild.channels.cache.get('1340123293999205757');
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(`🎉 Welcome ${member.user.username}! 🎉`)
    .setDescription(`**Welcome <@${member.id}>!**\nThank you for joining <@103868167563426816>. 💸\n\n> 💌 **Make sure to invite your friends:** [da.fcs.dance?u=1234567890123456](https://da.fcs.dance)\n> 💼 **To buy or sell your skins go to:**\n<t:1718503510883:F>\n\n**Enjoy your stay!**`)
    .setImage('https://cdn.discordapp.com/attachments/131965820540283715/1391996955040968722/standard_6.gif')
    .setColor('Green');
  channel.send({ embeds: [embed] });
});

// ========== PANEL COMMANDS ==========
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'sendpanel' || interaction.commandName === 'sendpanel2') {
    const sellPanel = interaction.commandName === 'sendpanel2';

    const options = [
      { label: 'Da Hood', value: 'buy_da_hood', emoji: { id: '1338859999787270275' } },
      { label: 'BladeBall', value: 'buy_bladeball', emoji: { id: '1338859997378484286' } },
      { label: 'Limiteds', value: 'buy_limiteds', emoji: { id: '1372117119741874184' } },
      { label: 'Robux', value: 'buy_robux', emoji: { id: '1388010865487687778' } }
    ];

    if (!sellPanel) {
      options.push({ label: 'Grow a Garden', value: 'buy_grow_garden', emoji: { id: '123456789012345678' } });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId(sellPanel ? 'sell_menu' : 'buy_menu')
      .setPlaceholder('Choose a service...')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setTitle(sellPanel ? '📤 SELL TICKET PANEL' : '📥 BUY TICKET PANEL')
      .setDescription('Click below to choose a ticket type!')
      .setImage('https://cdn.discordapp.com/attachments/131965820540283715/139165820542805746/standard_6.gif')
      .setColor('Blue');

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false
    });
  }
});

// ========== DROPDOWN SELECTION ==========
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_${interaction.values[0]}`)
    .setTitle(interaction.customId.startsWith('sell') ? 'Sell Order Form' : 'Buy Order Form');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('item')
        .setLabel(interaction.customId.startsWith('sell') ? 'Skin(s) You Want To Sell?' : 'Skin(s) You Want To Buy?')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('payment')
        .setLabel('Payment Method')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('username')
        .setLabel('Your Roblox Username')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    )
  );

  await interaction.showModal(modal);
});

// ========== MODAL SUBMIT ==========
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) return;

  const item = interaction.fields.getTextInputValue('item');
  const payment = interaction.fields.getTextInputValue('payment');
  const username = interaction.fields.getTextInputValue('username');

  const ticketChannel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`,
    type: 0,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel]
      }
    ]
  });

  const embed = new EmbedBuilder()
    .setTitle('📩 New Ticket')
    .addFields(
      { name: 'Item(s)', value: item },
      { name: 'Payment Method', value: payment },
      { name: 'Roblox Username', value: username }
    )
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `User: ${interaction.user.tag}` })
    .setColor('DarkBlue');

  const welcome = new EmbedBuilder()
    .setTitle('👋 Welcome to your ticket!')
    .setDescription(`Hey <@${interaction.user.id}>! Please wait while our team reviews your request.`)
    .setImage('https://cdn.discordapp.com/attachments/131965820540283715/1391996955040968722/standard_6.gif')
    .setColor('Green');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('save_transcript')
      .setLabel('Save Transcript')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('delete_ticket')
      .setLabel('Delete Ticket')
      .setStyle(ButtonStyle.Danger)
  );

  await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [welcome] });
  await ticketChannel.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, ephemeral: true });
});

// ========== BUTTON HANDLERS ==========
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  const member = await interaction.guild.members.fetch(interaction.user.id);

  if (interaction.customId === 'close_ticket') {
    await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
      ViewChannel: false
    });
    await interaction.reply({ content: '✅ You have been removed from the ticket.', ephemeral: true });
  }

  if (interaction.customId === 'delete_ticket') {
    if (!member.roles.cache.has('1332256090993463306')) {
      return interaction.reply({ content: '❌ You do not have permission to delete tickets.', ephemeral: true });
    }
    await interaction.reply({ content: '🗑️ Deleting ticket in 3 seconds...' });
    setTimeout(() => interaction.channel.delete(), 3000);
  }

  if (interaction.customId === 'save_transcript') {
    if (!member.roles.cache.has('1332256090993463306')) {
      return interaction.reply({ content: '❌ You do not have permission to generate transcripts.', ephemeral: true });
    }

    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const doc = new PDFDocument();
    const filePath = path.join(__dirname, `transcript-${interaction.channel.id}.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    messages.reverse().forEach(msg => {
      doc.text(`[${msg.author.tag}]: ${msg.content}`);
    });

    doc.end();

    stream.on('finish', async () => {
      const logChannel = interaction.guild.channels.cache.get('1343230007253925898');
      if (logChannel) {
        await logChannel.send({
          content: `📝 Transcript for ${interaction.channel.name}`,
          files: [filePath]
        });
      }
      await interaction.reply({ content: '📄 Transcript saved and sent to logs!', ephemeral: true });
      fs.unlinkSync(filePath);
    });
  }
});

client.login(process.env.TOKEN);
