const {
  Client,
  Interaction,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  name: "uptime",
  description: "Get the bot's current uptime.",

  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      await interaction.deferReply();

      const totalSeconds = Math.floor(client.uptime / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const parts = [];
      if (days) parts.push(`**${days}** day${days !== 1 ? "s" : ""}`);
      if (hours) parts.push(`**${hours}** hour${hours !== 1 ? "s" : ""}`);
      if (minutes) parts.push(`**${minutes}** minute${minutes !== 1 ? "s" : ""}`);
      if (seconds || parts.length === 0) parts.push(`**${seconds}** second${seconds !== 1 ? "s" : ""}`);

      const embed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("Bot Uptime")
        .setDescription(`${parts.join(", ")}`)
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching uptime:", error);
      await interaction.editReply("An error occurred while fetching the bot's uptime.");
    }
  },
};
