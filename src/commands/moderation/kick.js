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

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const targetUserId = interaction.options.get("target-user").value;
    const reason =
      interaction.options.get("reason")?.value || "N/A";

    await interaction.deferReply();

    const targetUser = await interaction.guild.members.fetch(targetUserId).catch(() => null);

    if (!targetUser) {
      await interaction.editReply("That user doesn't exist in this server.");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Success")
      .setColor("#4ea554")
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .addFields(
        {
          name: "User Kicked:",
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

    if (targetUser.id === interaction.guild.ownerId) {
      await interaction.editReply(
        "You can't kick that user because they're the server owner."
      );
      return;
    }

    const targetUserRolePosition = targetUser.roles.highest.position;
    const requestUserRolePosition = interaction.member.roles.highest.position;
    const botRolePosition = interaction.guild.members.me.roles.highest.position;

    if (targetUserRolePosition >= requestUserRolePosition) {
      await interaction.editReply(
        "You can't kick that user because they have the same/higher role than you."
      );
      return;
    }

    if (targetUserRolePosition >= botRolePosition) {
      await interaction.editReply(
        "I can't kick that user because they have the same/higher role than me."
      );
      return;
    }

    try {
      await targetUser.kick({ reason });
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
            .setTitle("Kick Log")
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        } else {
          console.error("Log channel not found.");
        }
      }
    } catch (error) {
      console.log(`There was an error when kicking: ${error}`);
      await interaction.editReply("An error occurred while trying to kick the user.");
    }
  },

  name: "kick",
  description: "Kicks a member from this server.",
  options: [
    {
      name: "target-user",
      description: "The user you want to kick.",
      type: ApplicationCommandOptionType.Mentionable,
      required: true,
    },
    {
      name: "reason",
      description: "The reason you want to kick.",
      type: ApplicationCommandOptionType.String,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.KickMembers],
  botPermissions: [PermissionFlagsBits.KickMembers],
};
