const { 
    Client, 
    Interaction, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
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
      .setCustomId("vouch_modal")
      .setTitle("Submit a Vouch");

    const personalIdInput = new TextInputBuilder()
      .setCustomId("personal_id")
      .setLabel("Your User ID")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Enter your Discord User ID")
      .setRequired(true);

    const helpedIdInput = new TextInputBuilder()
      .setCustomId("helped_id")
      .setLabel("Person Helped User ID")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Enter the User ID of the person you helped")
      .setRequired(true);

    const problemInput = new TextInputBuilder()
      .setCustomId("problem")
      .setLabel("Problem")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Describe the problem you helped with")
      .setRequired(true);

    const solutionInput = new TextInputBuilder()
      .setCustomId("solution")
      .setLabel("Solution")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Explain how you solved the problem")
      .setRequired(true);

    const pictureInput = new TextInputBuilder()
      .setCustomId("picture_links")
      .setLabel("Picture Link(s)")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Provide proof (image links)")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(personalIdInput),
      new ActionRowBuilder().addComponents(helpedIdInput),
      new ActionRowBuilder().addComponents(problemInput),
      new ActionRowBuilder().addComponents(solutionInput),
      new ActionRowBuilder().addComponents(pictureInput)
    );

    await interaction.showModal(modal);

    const filter = (i) => i.customId === "vouch_modal" && i.user.id === interaction.user.id;
    interaction.awaitModalSubmit({ filter, time: 60000 }).then(async (modalInteraction) => {
      const personalId = modalInteraction.fields.getTextInputValue("personal_id");
      const helpedId = modalInteraction.fields.getTextInputValue("helped_id");
      const problem = modalInteraction.fields.getTextInputValue("problem");
      const solution = modalInteraction.fields.getTextInputValue("solution");
      const pictureLinks = modalInteraction.fields.getTextInputValue("picture_links");

      const embed = new EmbedBuilder()
        .setColor("#4ea554")
        .setTitle("Vouch Submission")
        .setThumbnail(modalInteraction.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User Vouching", value: `<@${personalId}>` },
          { name: "User Helped", value: `<@${helpedId}>` },
          { name: "Problem", value: problem },
          { name: "Solution", value: solution },
          { name: "Proof (Picture Links)", value: pictureLinks }
        )
        .setTimestamp()
        .setFooter({ 
            text: `Submitted by ${modalInteraction.user.tag}`,
            iconURL: modalInteraction.user.displayAvatarURL({ dynamic: true }),
         });

      const vouchChannelId = "";
      const vouchChannel = await interaction.guild.channels.fetch(vouchChannelId);
      if (vouchChannel) {
        await vouchChannel.send({ embeds: [embed] });
      }

      await modalInteraction.reply({ content: "✅ Vouch successfully submitted.", ephemeral: true });
    }).catch((err) => {
      console.error("Error handling vouch submission:", err);
    });
  },

  name: "vouch",
  description: "Submit a vouch for someone you've helped.",
};
