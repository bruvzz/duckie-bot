const {
  Client,
  Interaction,
  EmbedBuilder,
} = require("discord.js");

const reviewChannelId = "";
const allowedRole = "";

module.exports = {
  name: "request-a-key",
  description: "Request a key by providing your Wave username and optional email.",
  options: [
    {
      name: "username",
      description: "Your Wave username",
      type: 3, // STRING
      required: true,
    },
    {
      name: "email",
      description: "Your Wave email",
      type: 3, // STRING
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
        return await interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
      }

      const waveUsername = interaction.options.getString("username");
      const waveEmail = interaction.options.getString("email");
      const user = interaction.user;

      const embed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("🔑 New Key Request")
        .addFields(
          { name: "User", value: `<@${user.id}>` },
          { name: "Wave Username", value: waveUsername }
        )
        .setTimestamp();

      if (waveEmail) {
        embed.addFields({ name: "Wave Email", value: waveEmail });
      }

      const reviewChannel = await client.channels.fetch(reviewChannelId);
      if (!reviewChannel || !reviewChannel.isTextBased()) {
        return await interaction.reply({
          content: "❌ Could not find the review channel.",
          ephemeral: true,
        });
      }

      await reviewChannel.send({ embeds: [embed] });

      await interaction.reply({
        content: "✅ Your key request has been submitted!",
        ephemeral: true,
      });

    } catch (error) {
      console.error("Error submitting key request:", error);
      await interaction.reply({
        content: "❌ Something went wrong while submitting your request.",
        ephemeral: true,
      });
    }
  },
};
