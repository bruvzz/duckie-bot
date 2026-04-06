const { 
  Client, 
  Interaction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
 } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const allowedRole = "";
    const managerRole = "";
    
    
    const staffLogsPath = path.join(__dirname, "..", "staffLogs.json");
	  const cooldownsPath = path.join(__dirname, "..", "cooldowns.json");

    if (!interaction.member.roles.cache.has(allowedRole)) {
      return await interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
    }

    if (fs.existsSync(cooldownsPath)) {
      const cooldowns = JSON.parse(fs.readFileSync(cooldownsPath, "utf-8"));
      if (cooldowns["staff-leave"] && cooldowns["staff-leave"][interaction.user.id]) {
        const expirationTime = cooldowns["staff-leave"][interaction.user.id];
        if (Date.now() < expirationTime) {
          return await interaction.reply({ 
            content: `❌ You are on cooldown! You can use this command again <t:${Math.floor(expirationTime / 1000)}:R>.`, 
            ephemeral: true 
          });
        }
      }
    }

    const modal = new ModalBuilder()
      .setCustomId("staffleave_modal")
      .setTitle("Staff Leave Form");

    const reasonInput = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Reason for leaving")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g., Vacation, Sick leave, Personal reasons")
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("description")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Provide additional context")
      .setRequired(true);

    const departureInput = new TextInputBuilder()
      .setCustomId("departure")
      .setLabel("Date of Departure (YYYY-MM-DD)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g., 2025-02-20")
      .setRequired(true);

    const arrivalInput = new TextInputBuilder()
      .setCustomId("arrival")
      .setLabel("Date of Arrival (YYYY-MM-DD)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g., 2025-02-25")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(reasonInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(departureInput),
      new ActionRowBuilder().addComponents(arrivalInput)
    );

    await interaction.showModal(modal);

    const filter = (i) => i.customId === "staffleave_modal" && i.user.id === interaction.user.id;
    
    try {
      const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 60000 });
      
      const reason = modalInteraction.fields.getTextInputValue("reason");
      const description = modalInteraction.fields.getTextInputValue("description") || "N/A";
      const departure = modalInteraction.fields.getTextInputValue("departure");
      const arrival = modalInteraction.fields.getTextInputValue("arrival");

      const parseDateToTimestamp = (dateStr) => {
          const parts = dateStr.split('-').map(num => parseInt(num));
          if (parts.length !== 3) return null;
          const [year, month, day] = parts;
          return Math.floor(Date.UTC(year, month - 1, day, 12) / 1000);
      };
      
      const departureTimestamp = parseDateToTimestamp(departure);
      const arrivalTimestamp = arrival.toLowerCase() !== "n/a" 
          ? parseDateToTimestamp(arrival)
          : null;

      const embed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("Staff Leave Notice")
        .setThumbnail(modalInteraction.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`A Staff Member has submitted a leave request.`)
        .addFields(
          { name: "Staff Member", value: `<@${modalInteraction.user.id}>`, inline: false },
          { name: "Reason", value: `${reason}`, inline: false },
          { name: "Date of Departure", value: departureTimestamp ? `<t:${departureTimestamp}:F> (<t:${departureTimestamp}:R>)` : "Invalid Date", inline: false },
          { name: "Date of Arrival", value: arrivalTimestamp ? `<t:${arrivalTimestamp}:F> (<t:${arrivalTimestamp}:R>)` : "N/A", inline: false },
          { name: "Description", value: `${description}` },
          { name: "Status", value: "Pending Decision", inline: true }
        )
        .setTimestamp()
        .setFooter({ 
            text: `Submitted by ${modalInteraction.user.tag}`,
            iconURL: modalInteraction.user.displayAvatarURL({ dynamic: true }),
         });

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("accept_leave")
          .setLabel("Accept")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("deny_leave")
          .setLabel("Deny")
          .setStyle(ButtonStyle.Danger)
      );

      const targetChannelId = "";
      const targetChannel = await interaction.guild.channels.fetch(targetChannelId);
      
      let message;
      if (targetChannel) {
        message = await targetChannel.send({ embeds: [embed], components: [buttons] });
      }

      await modalInteraction.reply({ content: "✅ Your leave request has been submitted.", ephemeral: true });

      if (!message) return;

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 0,
      });

      collector.on("collect", async (buttonInteraction) => {
        if (!buttonInteraction.member.roles.cache.has(managerRole)) {
          return await buttonInteraction.reply({ content: "❌ You do not have the required role to decide on this request.", ephemeral: true });
        }

        const isAccepted = buttonInteraction.customId === "accept_leave";
        
        if (isAccepted) {
          if (fs.existsSync(staffLogsPath)) {
            const logs = JSON.parse(fs.readFileSync(staffLogsPath, "utf-8"));
            if (logs[modalInteraction.user.id]) {
              logs[modalInteraction.user.id].status = "LoA";
              fs.writeFileSync(staffLogsPath, JSON.stringify(logs, null, 2));
            }
          }

          const acceptedEmbed = EmbedBuilder.from(embed)
            .setColor("Green")
            .setFields(
              ...embed.data.fields.filter(f => f.name !== "Status"),
              { name: "Status", value: "Accepted (LoA)", inline: true },
              { name: "Processed By", value: `<@${buttonInteraction.user.id}>`, inline: true }
            );

          const returnButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("return_from_leave")
              .setLabel("Return from Leave")
              .setStyle(ButtonStyle.Primary)
          );

          await buttonInteraction.update({ embeds: [acceptedEmbed], components: [returnButton] });
          
          const returnCollector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 0,
          });

          returnCollector.on("collect", async (returnInteraction) => {
            if (returnInteraction.customId === "return_from_leave") {
              // Only the staff member who submitted the request or a manager can click Return
              if (returnInteraction.user.id !== modalInteraction.user.id && !returnInteraction.member.roles.cache.has(managerRole)) {
                return await returnInteraction.reply({ content: "❌ Only the staff member or a manager can mark the return.", ephemeral: true });
              }

              if (fs.existsSync(staffLogsPath)) {
                const logs = JSON.parse(fs.readFileSync(staffLogsPath, "utf-8"));
                if (logs[modalInteraction.user.id]) {
                  logs[modalInteraction.user.id].status = "Active";
                  fs.writeFileSync(staffLogsPath, JSON.stringify(logs, null, 2));
                }
              }

              const cooldowns = fs.existsSync(cooldownsPath) ? JSON.parse(fs.readFileSync(cooldownsPath, "utf-8")) : {};
              if (!cooldowns["staff-leave"]) cooldowns["staff-leave"] = {};
              
              const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
              cooldowns["staff-leave"][modalInteraction.user.id] = Date.now() + twoWeeksInMs;
              fs.writeFileSync(cooldownsPath, JSON.stringify(cooldowns, null, 2));

              const returnedEmbed = EmbedBuilder.from(acceptedEmbed)
                .setColor("Blue")
                .setFields(
                  ...acceptedEmbed.data.fields.filter(f => f.name !== "Status" && f.name !== "Processed By"),
                  { name: "Status", value: "Returned (Active)", inline: true },
                  { name: "Cooldown Ends", value: `<t:${Math.floor((Date.now() + twoWeeksInMs) / 1000)}:R>`, inline: true }
                );

              await returnInteraction.update({ embeds: [returnedEmbed], components: [] });
              returnCollector.stop();
            }
          });

        } else {
          const deniedEmbed = EmbedBuilder.from(embed)
            .setColor("Red")
            .setFields(
              ...embed.data.fields.filter(f => f.name !== "Status"),
              { name: "Status", value: "Denied", inline: true },
              { name: "Processed By", value: `<@${buttonInteraction.user.id}>`, inline: true }
            );

          await buttonInteraction.update({ embeds: [deniedEmbed], components: [] });
        }
        
        collector.stop();
      });

    } catch (err) {
      if (err.code !== "INTERACTION_COLLECTOR_ERROR") {
        console.error("Error handling staff leave:", err);
      }
    }
  },

  name: "staff-leave",
  description: "Submit a staff leave request.",
};
