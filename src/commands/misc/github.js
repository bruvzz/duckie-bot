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
      await interaction.deferReply({ ephemeral: true });

      const botUsername = "bruvzz";
      const botRepository = "duckie-bot";

      const profileUrl = `https://github.com/${botUsername}`;
      const repoUrl = `https://github.com/${botUsername}/${botRepository}`;
      const profileAvatar = `https://github.com/${botUsername}.png`;

      const embed = new EmbedBuilder()
        .setColor("#4ea554")
        .setTitle("Bot GitHub Links")
        .setDescription("Here are the GitHub links related to this bot:")
        .setThumbnail(profileAvatar)
        .addFields(
          { name: "GitHub Profile", value: `[Profile](${profileUrl})`, inline: true },
          { name: "Repository", value: `[Repository](${repoUrl})`, inline: true }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error handling GitHub command:", error);
      await interaction.editReply({
        content: "An error occurred while generating the GitHub links.",
      });
    }
  },

  name: "github",
  description: "Get the GitHub profile and repository of the bot.",
};
