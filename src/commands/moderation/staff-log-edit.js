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
const sendLog = require("../../utils/sendLog");

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
        return await interaction.editReply("No staff logs exist yet.");
      }

      let staffLogs = {};
      const fileData = fs.readFileSync(filePath, "utf8");
      if (fileData.trim().length) {
        try {
          staffLogs = JSON.parse(fileData);
        } catch {
          return await interaction.editReply(
            "Error reading staff logs file."
          );
        }
      }

      const log = staffLogs[userId];

      if (!log) {
        return await interaction.editReply(
          `No staff log found for user ID \`${userId}\`.`
        );
      }

      const joinedStaff = interaction.options.getInteger("joinedstaff");
      const positionRole = interaction.options.getRole("position");
      const timeInPosition =
        interaction.options.getInteger("timeinposition");
      const status = interaction.options.getString("status");

      if (!joinedStaff && !positionRole && !timeInPosition && !status) {
        return await interaction.editReply(
          "You must provide at least one field to update."
        );
      }

      const embed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("📝 Staff Log Edit Preview")
        .addFields(
          {
            name: "Joined Staff",
            value: `<t:${log.joinedStaff}:F> → ${
              joinedStaff ? `<t:${joinedStaff}:F>` : "No Change"
            }`,
            inline: true,
          },
          {
            name: "Position",
            value: `<@&${log.positionId}> → ${
              positionRole ? positionRole.toString() : "No Change"
            }`,
            inline: true,
          },
          {
            name: "Time In Position",
            value: `<t:${log.timeInPosition}:F> → ${
              timeInPosition ? `<t:${timeInPosition}:F>` : "No Change"
            }`,
            inline: true,
          },
          {
            name: "Status",
            value: `${log.status} → ${status || "No Change"}`,
            inline: true,
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      const confirmButton = new ButtonBuilder()
        .setCustomId("staff_log_edit_confirm")
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success);

      const cancelButton = new ButtonBuilder()
        .setCustomId("staff_log_edit_cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(
        confirmButton,
        cancelButton
      );

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

        if (i.customId === "staff_log_edit_confirm") {
          const oldData = { ...log };

          if (joinedStaff) log.joinedStaff = joinedStaff;
          if (positionRole) log.positionId = positionRole.id;
          if (timeInPosition) log.timeInPosition = timeInPosition;
          if (status) log.status = status;

          fs.writeFileSync(filePath, JSON.stringify(staffLogs, null, 2));

          const changes = [];

          if (joinedStaff) {
            changes.push(
              `Joined Staff: <t:${oldData.joinedStaff}:F> → <t:${joinedStaff}:F>`
            );
          }

          if (positionRole) {
            changes.push(
              `Position: <@&${oldData.positionId}> → ${positionRole}`
            );
          }

          if (timeInPosition) {
            changes.push(
              `Time In Position: <t:${oldData.timeInPosition}:F> → <t:${timeInPosition}:F>`
            );
          }

          if (status) {
            changes.push(
              `Status: ${oldData.status} → ${status}`
            );
          }

          const logEmbed = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle("📝 Staff Log Updated")
            .addFields(
              { name: "User", value: `<@${userId}>`, inline: true },
              {
                name: "Changes",
                value: changes.join("\n") || "No changes",
              }
            )
            .setFooter({
              text: `Edited by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

          await sendLog(client, interaction.guild.id, logEmbed);

          await i.update({
            content: "✅ Staff log successfully updated.",
            embeds: [],
            components: [],
          });

          collector.stop();
        }

        if (i.customId === "staff_log_edit_cancel") {
          await i.update({
            content: "❌ Staff log edit cancelled.",
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
      console.error("Error editing staff log:", error);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(
          "An error occurred while trying to edit the staff log."
        );
      }
    }
  },

  name: "staff-log-edit",
  description: "Edits an existing staff log entry.",

  options: [
    {
      name: "userid",
      description: "User ID of the staff member",
      type: 3,
      required: true,
    },
    {
      name: "joinedstaff",
      description: "UNIX timestamp of when they joined staff",
      type: 4,
      required: false,
    },
    {
      name: "position",
      description: "Current staff position (role)",
      type: 8,
      required: false,
    },
    {
      name: "timeinposition",
      description: "UNIX timestamp of when they entered this position",
      type: 4,
      required: false,
    },
    {
      name: "status",
      description: "Current staff status",
      type: 3,
      required: false,
      choices: [
        { name: "Active", value: "Active" },
        { name: "LoA", value: "LoA" },
        { name: "Demoted", value: "Demoted" },
        { name: "Resigned", value: "Resigned" },
      ],
    },
  ],
};
