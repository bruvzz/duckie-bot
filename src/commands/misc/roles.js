const {
  Client,
  Interaction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      await interaction.deferReply();

      const guild = interaction.guild;

      if (!guild) {
        return await interaction.editReply("This command can only be used in a server.");
      }

      const roles = guild.roles.cache
        .filter((role) => role.name !== "@everyone")
        .sort((a, b) => b.position - a.position);

      if (!roles.size) {
        return await interaction.editReply("This server has no roles.");
      }

      const roleList = roles.map((role) => `${role}`).join("\n");

      const embed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("📋 Roles List")
        .setDescription(roleList)
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      const countButton = new ButtonBuilder()
        .setCustomId("role_count_button")
        .setLabel(`Total Roles: ${roles.size}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

      const row = new ActionRowBuilder().addComponents(countButton);

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      await interaction.editReply("An error occurred while trying to fetch the roles.");
    }
  },

  name: "roles",
  description: "Displays a list of all roles in the server.",
};
