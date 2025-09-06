const { 
  Client, 
  Interaction, 
  EmbedBuilder, 
  PermissionsBitField, 
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
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
      }

      const targetUser = interaction.options.getUser("user");
      const warnId = interaction.options.getInteger("id");

      if (!targetUser || !warnId) {
        return await interaction.reply({ content: "Please provide a valid user and warn ID.", ephemeral: true });
      }

      let modLogs = {};
      if (fs.existsSync(logsFilePath)) {
        modLogs = JSON.parse(fs.readFileSync(logsFilePath));
      }

      if (!modLogs[targetUser.id] || modLogs[targetUser.id].length === 0) {
        return await interaction.reply({ content: "This user has no warnings.", ephemeral: true });
      }

      const index = modLogs[targetUser.id].findIndex(w => w.warnId === warnId);

      if (index === -1) {
        return await interaction.reply({ content: `No warning found with ID **#${warnId}** for this user.`, ephemeral: true });
      }

      const removedWarn = modLogs[targetUser.id].splice(index, 1)[0];

      fs.writeFileSync(logsFilePath, JSON.stringify(modLogs, null, 2));

      const embed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("Success")
        .addFields(
          { name: "User Removed:", value: `${targetUser} (${targetUser.id})`, inline: true },
          { name: "Warn ID:", value: `\`#${removedWarn.warnId}\``, inline: true },
          { name: "Reason:", value: `\`${removedWarn.reason}\``, inline: true },
          { name: "Moderator:", value: `${interaction.user} (${interaction.user.id})`, inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error("Error handling delwarn command:", error);
      if (!interaction.replied) {
        await interaction.reply({ content: "An error occurred while removing the warning.", ephemeral: true });
      }
    }
  },

  name: "delwarn",
  description: "Remove a warning from a user by ID.",
  options: [
    {
      name: "user",
      description: "The user whose warning you want to remove.",
      type: 6,
      required: true,
    },
    {
      name: "id",
      description: "The warning ID to remove.",
      type: 4,
      required: true,
    },
  ],
};
