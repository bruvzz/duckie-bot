const {
  Client,
  Interaction,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../staffLogs.json");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      await interaction.deferReply({ ephemeral: false });

      const userId = interaction.options.getString("userid");

      if (!fs.existsSync(filePath)) {
        return await interaction.editReply(
          "No staff logs exist yet."
        );
      }

      let staffLogs = {};
      const fileData = fs.readFileSync(filePath, "utf8");
      if (fileData.trim().length) {
        try {
          staffLogs = JSON.parse(fileData);
        } catch (err) {
          console.error("Corrupted staffLogs.json");
          return await interaction.editReply(
            "Error reading staff logs file."
          );
        }
      }

      const log = staffLogs[userId];

      if (!log) {
        return await interaction.editReply(
          `No staff log found for User ID \`${userId}\`.`
        );
      }

      const guild = interaction.guild;
      let member;
      let positionRole;
      if (guild) {
        member = await guild.members.fetch(userId).catch(() => null);
        positionRole = guild.roles.cache.get(log.positionId);
      }

      const embed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("📋 Staff Log")
        .setThumbnail(member?.user.displayAvatarURL({ dynamic: true }) || null)
        .addFields(
          {
            name: "User",
            value: member ? `<@${userId}>` : "Unknown User",
            inline: true,
          },
          { name: "User ID", value: `\`${userId}\``, inline: true },
          {
            name: "Joined Staff",
            value: `<t:${log.joinedStaff}:F>`,
            inline: true,
          },
          {
            name: "Position",
            value: positionRole ? `${positionRole}` : "Unknown Role",
            inline: true,
          },
          {
            name: "Time In Position",
            value: `<t:${log.timeInPosition}:F>`,
            inline: true,
          },
          {
            name: "Status",
            value: log.status,
            inline: true,
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching staff log:", error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(
          "An error occurred while trying to fetch the staff log."
        );
      }
    }
  },

  name: "staff-log",
  description: "Displays a user's staff log.",

  options: [
    {
      name: "userid",
      description: "The user ID to view the staff log for",
      type: 3,
      required: true,
    },
  ],
};
