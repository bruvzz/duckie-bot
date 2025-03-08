const { 
  Client, 
  Interaction, 
  EmbedBuilder, 
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const logsFilePath = path.join(__dirname, "../modlogs.json");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      const targetUser = interaction.options.getUser("user");

      if (!targetUser) {
        return await interaction.reply({ content: "Please provide a valid user.", ephemeral: true });
      }

      let modLogs = {};
      if (fs.existsSync(logsFilePath)) {
        const data = fs.readFileSync(logsFilePath);
        modLogs = JSON.parse(data);
      }

      const userLogs = modLogs[targetUser.id] || [];

      if (userLogs.length === 0) {
        return await interaction.reply({ content: `No moderation history found for **${targetUser.tag}**.`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor("#4ea554")
        .setTitle(`Moderation Logs for ${targetUser.tag}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setDescription(userLogs.map(log => `**[${log.type}]** - \`${log.reason}\` (By: <@${log.moderator}>) - <t:${log.timestamp}:F>`).join("\n") || "No logs found.")
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching mod logs:", error);
      await interaction.reply({ content: "An error occurred while retrieving moderation logs.", ephemeral: true });
    }
  },

  name: "modlogs",
  description: "View moderation history of a user.",
  options: [
    {
      name: "user",
      description: "The user whose mod logs you want to view.",
      type: 6,
      required: true,
    },
  ],
};
