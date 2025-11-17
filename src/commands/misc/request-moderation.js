const {
  Client,
  Interaction,
  EmbedBuilder,
} = require("discord.js");

const reviewChannelId = "";
const allowedRole = "";

module.exports = {
  name: "request-moderation",
  description: "Request moderation permissions for a specific role.",
  options: [
    {
      name: "role",
      description: "The role you are requesting for moderation.",
      type: 8,
      required: true,
    },
    {
      name: "user-to-moderate",
      description: "The user ID of the member who needs moderation.",
      type: 3,
      required: true,
    },
    {
      name: "reason",
      description: "The reason you are requesting moderation.",
      type: 3,
      required: true,
    },
    {
      name: "images",
      description: "Any image links or attachments supporting your reason.",
      type: 3,
      required: false,
    },
  ],

  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {

      if (!interaction.member.roles.cache.has(allowedRole)) {
        return await interaction.reply({
          content: "❌ You don't have permission to use this command.",
          ephemeral: true,
        });
      }

      const requestedRole = interaction.options.getRole("role");
      const targetUserId = interaction.options.getString("user-to-moderate");
      const reason = interaction.options.getString("reason");
      const images = interaction.options.getString("images");
      const user = interaction.user;

      const embed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("🛡️ New Moderation Request")
        .addFields(
          { name: "Requested By", value: `<@${user.id}>` },
          { name: "User to Moderate", value: `<@${targetUserId}> (\`${targetUserId}\`)` },
          { name: "Reason", value: `\`${reason}\`` }
        )
        .setTimestamp();

      if (images) {
        embed.addFields({ name: "Images / Evidence", value: images });
      }

      const reviewChannel = await client.channels.fetch(reviewChannelId);
      if (!reviewChannel || !reviewChannel.isTextBased()) {
        return await interaction.reply({
          content: "❌ Could not find the review channel.",
          ephemeral: true,
        });
      }

      await reviewChannel.send({
        content: `${requestedRole} — New Moderation Request`,
      });

      await reviewChannel.send({ embeds: [embed] });

      await interaction.reply({
        content: "✅ Your moderation request has been submitted!",
        ephemeral: false,
      });

    } catch (error) {
      console.error("Error submitting moderation request:", error);
      await interaction.reply({
        content: "❌ Something went wrong while submitting your request.",
        ephemeral: true,
      });
    }
  },
};
