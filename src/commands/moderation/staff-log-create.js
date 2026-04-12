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

const staffLogPath = path.join(__dirname, "../staffLogs.json");
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
        
      if (
        !interaction.member.roles.cache.has(STAFF_MANAGER_ROLE_ID)
      ) {
        return await interaction.editReply(
          "You do not have permission to use this command."
        );
      }

      const user = interaction.options.getUser("user");
      const userId = user.id;

      const joinedStaff = interaction.options.getInteger("joinedstaff");
      const positionRole = interaction.options.getRole("position");
      const timeInPosition =
        interaction.options.getInteger("timeinposition");
      const status = interaction.options.getString("status");

      if (
        !user ||
        !joinedStaff ||
        !positionRole ||
        !timeInPosition ||
        !status
      ) {
        return await interaction.editReply(
          "One or more required options are missing."
        );
      }

      let data = {};
      if (fs.existsSync(staffLogPath)) {
        data = JSON.parse(fs.readFileSync(staffLogPath, "utf8"));
      }

      if (data[userId]) {
        return await interaction.editReply(
          "A staff log already exists for this user."
        );
      }

      const embed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("📋 Staff Log Preview")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User", value: `<@${userId}>`, inline: true },
          { name: "User ID", value: `\`${userId}\``, inline: true },
          {
            name: "Joined Staff",
            value: `<t:${joinedStaff}:F>`,
            inline: true,
          },
          {
            name: "Position",
            value: `${positionRole}`,
            inline: true,
          },
          {
            name: "Time In Position",
            value: `<t:${timeInPosition}:F>`,
            inline: true,
          },
          { name: "Status", value: status, inline: true }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      const confirmButton = new ButtonBuilder()
        .setCustomId("staff_log_confirm")
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success);

      const cancelButton = new ButtonBuilder()
        .setCustomId("staff_log_cancel")
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

        if (i.customId === "staff_log_confirm") {
          data[userId] = {
            userId,
            joinedStaff,
            positionId: positionRole.id,
            timeInPosition,
            status,
            createdAt: Date.now(),
          };

          fs.writeFileSync(
            staffLogPath,
            JSON.stringify(data, null, 2)
          );

          await i.update({
            content: "✅ Staff log successfully created.",
            embeds: [],
            components: [],
          });

          collector.stop();
        }

        if (i.customId === "staff_log_cancel") {
          await i.update({
            content: "❌ Staff log creation cancelled.",
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
      console.error("Error creating staff log:", error);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(
          "An error occurred while trying to create the staff log."
        );
      }
    }
  },

  name: "staff-log-create",
  description: "Creates a new staff log entry.",

  options: [
    {
      name: "user",
      description: "Select the staff member",
      type: 6,
      required: true,
    },
    {
      name: "joinedstaff",
      description: "UNIX timestamp of when they joined staff",
      type: 4, 
      required: true,
    },
    {
      name: "position",
      description: "Current staff position (role)",
      type: 8, 
      required: true,
    },
    {
      name: "timeinposition",
      description: "UNIX timestamp of when they entered this position",
      type: 4, 
      required: true,
    },
    {
      name: "status",
      description: "Current staff status.",
      type: 3, 
      required: true,
      choices: [
        {
          name: "Active",
          value: "Active",
        },
        {
          name: "LoA",
          value: "LoA",
        },
        {
          name: "Demoted",
          value: "Demoted",
        },
        {
          name: "Resigned",
          value: "Resigned",
        },
      ],
    },
  ],
};
