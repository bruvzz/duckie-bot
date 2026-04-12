const {
  Client,
  Interaction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../staffLogs.json");
const STAFF_MANAGER_ROLE_ID = "";

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      if (!interaction.member.roles.cache.has(STAFF_MANAGER_ROLE_ID)) {
        return await interaction.editReply(
          "You do not have permission to use this command."
        );
      }

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
        .setColor("Red")
        .setTitle("⚠️ Confirm Staff Log Deletion")
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
          { name: "Status", value: log.status, inline: true }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      const confirmButton = new ButtonBuilder()
        .setCustomId("staff_log_delete_confirm")
        .setLabel("Confirm Deletion")
        .setStyle(ButtonStyle.Danger);

      const cancelButton = new ButtonBuilder()
        .setCustomId("staff_log_delete_cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      const message = await interaction.fetchReply();

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 15000,
      });

      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({
            content: "This confirmation is not for you.",
            ephemeral: true,
          });
        }

        if (i.customId === "staff_log_delete_confirm") {
          delete staffLogs[userId];
          fs.writeFileSync(filePath, JSON.stringify(staffLogs, null, 2));

          await i.update({
            content: "✅ Staff log successfully deleted.",
            embeds: [],
            components: [],
          });

          collector.stop();
        }

        if (i.customId === "staff_log_delete_cancel") {
          await i.update({
            content: "❌ Staff log deletion cancelled.",
            embeds: [],
            components: [],
          });

          collector.stop();
        }
      });

      collector.on("end", async (_, reason) => {
        if (reason === "time") {
          await interaction.editReply({
            content: "⌛ Confirmation timed out.",
            embeds: [],
            components: [],
          }).catch(() => {});
        }
      });
    } catch (error) {
      console.error("Error deleting staff log:", error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(
          "An error occurred while trying to delete the staff log."
        );
      }
    }
  },

  name: "staff-log-delete",
  description: "Deletes a staff log entry.",

  options: [
    {
      name: "userid",
      description: "User ID of the staff member to delete",
      type: 3,
      required: true,
    },
  ],
};
