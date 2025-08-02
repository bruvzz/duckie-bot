const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    EmbedBuilder,
    PermissionFlagsBits,
  } = require("discord.js");
  const fs = require("fs");
  const path = require("path");
  
  const logChannelsPath = path.join(__dirname, "../logChannels.json");
  const logsFilePath = path.join(__dirname, "../modlogs.json");
  
  module.exports = {
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
      try {
        await interaction.deferReply();
  
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
          return await interaction.editReply("❌ You don't have permission to unban members.");
        }
  
        const userId = interaction.options.getString("userid");
        const reason = interaction.options.getString("reason") || "N/A";
  
        if (!userId) {
          return await interaction.editReply("❌ Please provide a valid user ID.");
        }
  
        const bannedUsers = await interaction.guild.bans.fetch();
        const userBanInfo = bannedUsers.get(userId);
  
        if (!userBanInfo) {
          return await interaction.editReply("❌ This user is not currently banned.");
        }
  
        await interaction.guild.members.unban(userId, reason);
        const user = await client.users.fetch(userId);
  
        const embed = new EmbedBuilder()
          .setColor("Grey")
          .setTitle("✅ User Unbanned")
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .setTimestamp()
          .addFields(
            {
              name: "User Unbanned",
              value: `<@${user.id}> (${user.id})`,
              inline: true,
            },
            {
              name: "Moderator",
              value: `${interaction.user} (${interaction.user.id})`,
              inline: true,
            },
            {
              name: "Reason",
              value: `\`${reason}\``,
              inline: true,
            }
          );
  
        await interaction.editReply({ embeds: [embed] });
  
        // Log to mod channel
        let logChannels = {};
        if (fs.existsSync(logChannelsPath)) {
          logChannels = JSON.parse(fs.readFileSync(logChannelsPath, "utf-8"));
        }
  
        const logChannelId = logChannels[interaction.guild.id];
        if (logChannelId) {
          const logChannel = interaction.guild.channels.cache.get(logChannelId);
          if (logChannel) {
            const logEmbed = new EmbedBuilder(embed.data)
              .setTitle("Unban Log")
              .setTimestamp();
  
            await logChannel.send({ embeds: [logEmbed] });
          } else {
            console.warn("⚠️ Log channel ID found, but channel does not exist.");
          }
        }
  
        // Save to modlogs.json
        let modLogs = {};
        if (fs.existsSync(logsFilePath)) {
          const data = fs.readFileSync(logsFilePath);
          modLogs = JSON.parse(data);
        }
  
        if (!modLogs[user.id]) modLogs[user.id] = [];
  
        modLogs[user.id].push({
          type: "Unban",
          reason: reason,
          moderator: interaction.user.id,
          timestamp: Math.floor(Date.now() / 1000),
        });
  
        fs.writeFileSync(logsFilePath, JSON.stringify(modLogs, null, 2));
      } catch (error) {
        console.error("❌ Error unbanning user:", error);
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply("❌ An error occurred while trying to unban the user.");
        } else {
          await interaction.reply({
            content: "❌ An error occurred while trying to unban the user.",
            ephemeral: true,
          });
        }
      }
    },
  
    name: "unban",
    description: "Unban a member from the server.",
    options: [
      {
        name: "userid",
        description: "The ID of the user to unban.",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "reason",
        description: "The reason for unbanning the user.",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  };
