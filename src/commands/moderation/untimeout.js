const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const logChannelsPath = path.join(__dirname, "../logChannels.json");
const logsFilePath = path.join(__dirname, "../modlogs.json");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
      const mentionable = interaction.options.get("target-user").value;
      const reason = interaction.options.get("reason")?.value || "N/A";

      await interaction.deferReply();

      const targetUser = await interaction.guild.members.fetch(mentionable);

      const embed = new EmbedBuilder()
          .setTitle("Success")
          .setColor("Grey")
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
          .setTimestamp()
          .addFields(
              {
                  name: "User UnTimed-Out:",
                  value: `${targetUser} (${targetUser.id})`,
                  inline: true,
              },
              {
                  name: "Moderator:",
                  value: `${interaction.user} (${interaction.user.id})`,
                  inline: true,
              },
              {
                  name: "Reason:",
                  value: `\`${reason}\``,
                  inline: true,
              }
          );

      if (!targetUser) {
          await interaction.editReply("That user doesn't exist in this server.");
          return;
      }

      if (targetUser.user.bot) {
          await interaction.editReply("I can't timeout/untimeout a bot.");
          return;
      }

      const targetUserRolePosition = targetUser.roles.highest.position;
      const requestUserRolePosition = interaction.member.roles.highest.position;
      const botRolePosition = interaction.guild.members.me.roles.highest.position;

      if (targetUserRolePosition >= requestUserRolePosition) {
          await interaction.editReply(
              "You can't untimeout that user because they have the same/higher role than you."
          );
          return;
      }

      if (targetUserRolePosition >= botRolePosition) {
          await interaction.editReply(
              "I can't untimeout that user because they have the same/higher role than me."
          );
          return;
      }

      try {
          if (targetUser.isCommunicationDisabled()) {
              await targetUser.timeout(null, reason);
              await interaction.editReply({ embeds: [embed] });
          } else {
              await targetUser.timeout(null, reason);
              await interaction.editReply({ embeds: [embed] });
          }

          let logChannels = {};
          if (fs.existsSync(logChannelsPath)) {
              logChannels = JSON.parse(fs.readFileSync(logChannelsPath, "utf-8"));
          }

          const logChannelId = logChannels[interaction.guild.id];
          if (logChannelId) {
              const logChannel = interaction.guild.channels.cache.get(logChannelId);
              if (logChannel) {
                  const logEmbed = new EmbedBuilder(embed.data)
                      .setTitle("UnTimeout Log")
                      .setTimestamp()

                  await logChannel.send({ embeds: [logEmbed] });
              } else {
                  console.error("Log channel not found.");
              }
          }

          let modLogs = {};
          if (fs.existsSync(logsFilePath)) {
            const data = fs.readFileSync(logsFilePath);
            modLogs = JSON.parse(data);
        }
                        
        if (!modLogs[targetUser.id]) modLogs[targetUser.id] = [];
                        
            modLogs[targetUser.id].push({
                type: "UnTimeout",
                reason: reason,
                moderator: interaction.user.id,
                timestamp: Math.floor(Date.now() / 1000),
            });
                        
        fs.writeFileSync(logsFilePath, JSON.stringify(modLogs, null, 2));
      } catch (error) {
          console.log(`There was an error when untimeoutting: ${error}`);
      }
  },

  name: "untimeout",
  description: "UnTimeout a user.",
  options: [
      {
          name: "target-user",
          description: "The user you want to untimeout.",
          type: ApplicationCommandOptionType.Mentionable,
          required: true,
      },
      {
          name: "reason",
          description: "The reason for the untimeout.",
          type: ApplicationCommandOptionType.String,
      },
  ],
  permissionsRequired: [PermissionFlagsBits.MuteMembers],
  botPermissions: [PermissionFlagsBits.MuteMembers],
};
