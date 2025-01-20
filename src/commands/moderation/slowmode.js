const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const ms = require("ms");
const fs = require("fs");
const path = require("path");

const logChannelsPath = path.join(__dirname, "../logChannels.json");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const mentionable = interaction.options.get("target-user").value;
    const duration = interaction.options.get("duration").value;
    const reason =
      interaction.options.get("reason")?.value || "N/A";

    await interaction.deferReply();

    const { default: prettyMs } = await import("pretty-ms");
    const msDuration = ms(duration);

    const targetUser = await interaction.guild.members.fetch(mentionable);

    const embed = new EmbedBuilder()
      .setTitle("Success")
      .setColor("#4ea554")
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .addFields(
        {
          name: "User Timed-Out:",
          value: `${targetUser} (${targetUser.id})`,
          inline: true,
        },
        {
          name: "Duration:",
          value: `${prettyMs(msDuration, { verbose: true })}`,
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
      await interaction.editReply("I can't timeout a bot.");
      return;
    }

    if (isNaN(msDuration)) {
      await interaction.editReply("Please provide a valid timeout duration.");
      return;
    }

    if (msDuration < 5000 || msDuration > 2.419e9) {
      await interaction.editReply(
        "Timeout duration cannot be less than 5 seconds or more than 28 days."
      );
      return;
    }

    const targetUserRolePosition = targetUser.roles.highest.position;
    const requestUserRolePosition = interaction.member.roles.highest.position;
    const botRolePosition = interaction.guild.members.me.roles.highest.position;

    if (targetUserRolePosition >= requestUserRolePosition) {
      await interaction.editReply(
        "You can't timeout that user because they have the same/higher role than you."
      );
      return;
    }

    if (targetUserRolePosition >= botRolePosition) {
      await interaction.editReply(
        "I can't timeout that user because they have the same/higher role than me."
      );
      return;
    }

    try {
      if (targetUser.isCommunicationDisabled()) {
        await targetUser.timeout(msDuration, reason);
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      await targetUser.timeout(msDuration, reason);
      await interaction.editReply({ embeds: [embed] });

      let logChannels = {};
      if (fs.existsSync(logChannelsPath)) {
        logChannels = JSON.parse(fs.readFileSync(logChannelsPath, "utf-8"));
      }

      const logChannelId = logChannels[interaction.guild.id];
      if (logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder(embed.data)
            .setTitle("Timeout Log")
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        } else {
          console.error("Log channel not found.");
        }
      }
    } catch (error) {
      console.log(`There was an error when timing out: ${error}`);
    }
  },

  name: "timeout",
  description: "Timeout a user.",
  options: [
    {
      name: "target-user",
      description: "The user you want to timeout.",
      type: ApplicationCommandOptionType.Mentionable,
      required: true,
    },
    {
      name: "duration",
      description: "Timeout duration (30m, 1h, 1 day).",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "reason",
      description: "The reason for the timeout.",
      type: ApplicationCommandOptionType.String,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.MuteMembers],
  botPermissions: [PermissionFlagsBits.MuteMembers],
};
