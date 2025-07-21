const { 
  Client, 
  Interaction, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  EmbedBuilder,
 } = require("discord.js");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const allowedRole = "";

    if (!interaction.member.roles.cache.has(allowedRole)) {
      return await interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
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
    interaction.awaitModalSubmit({ filter, time: 60000 }).then(async (modalInteraction) => {
      const reason = modalInteraction.fields.getTextInputValue("reason");
      const description = modalInteraction.fields.getTextInputValue("description") || "N/A";
      const departure = modalInteraction.fields.getTextInputValue("departure");
      const arrival = modalInteraction.fields.getTextInputValue("arrival");

    const parseDateToTimestamp = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
        return Math.floor(Date.UTC(year, month - 1, day, 12) / 1000); // Set to midday to avoid timezone issues
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
          { name: "Date of Departure", value: `<t:${departureTimestamp}:F> (<t:${departureTimestamp}:R>)`, inline: false },
          { name: "Date of Arrival", value: arrivalTimestamp ? `<t:${arrivalTimestamp}:F> (<t:${arrivalTimestamp}:R>)` : "N/A", inline: false },
          { name: "Description", value: `${description}` }
        )
        .setTimestamp()
        .setFooter({ 
            text: `Submitted by ${modalInteraction.user.tag}`,
            iconURL: modalInteraction.user.displayAvatarURL({ dynamic: true }),
         });

      const targetChannelId = "";
      const targetChannel = await interaction.guild.channels.fetch(targetChannelId);
      if (targetChannel) {
        await targetChannel.send({ embeds: [embed] });
      }

      await modalInteraction.reply({ content: "✅ Your leave request has been submitted.", ephemeral: true });
    }).catch((err) => {
      console.error("Error handling modal submission:", err);
    });
  },

  name: "staff-leave",
  description: "Submit a staff leave request.",
};
