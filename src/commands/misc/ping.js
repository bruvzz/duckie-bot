const { 
  Client, 
  Interaction, 
  EmbedBuilder,
 } = require("discord.js");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      const start = Date.now();

      await interaction.deferReply({ ephemeral: true });

      const reply = await interaction.fetchReply();
      const end = Date.now();

      const apiLatency = client.ws.ping;
      const botLatency = end - start;

      const embed = new EmbedBuilder()
        .setColor("#4ea554")
        .setTitle("Success")
        .setDescription("Here's my current latency statistics:")
        .addFields(
          { name: "Bot Latency", value: `\`${botLatency}ms\``, inline: true },
          { name: "API Latency", value: `\`${apiLatency}ms\``, inline: true }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error handling ping command:", error);
      await interaction.editReply({
        content: "An error occurred while trying to calculate the ping.",
        ephemeral: true,
      });
    }
  },

  name: "ping",
  description: "Check the bot's latency and API latency.",
};
