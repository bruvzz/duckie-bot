const { 
    Client, 
    Interaction, 
    EmbedBuilder, 
    PermissionsBitField, 
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
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
      }

      const targetUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "N/A";

      if (!targetUser) {
        return await interaction.reply({ content: "Please provide a valid user to warn.", ephemeral: true });
      }

      const guild = interaction.guild;
      let dmSent = "✅ **DM Sent Successfully.**";
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor("#a54e4e")
          .setTitle("Warning")
          .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
          .setDescription(`You have been warned in **${interaction.guild.name}**.`)
          .addFields({ name: "Reason", value: `\`${reason}\`` })
          .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.error(`Could not send DM to ${targetUser.tag}:`, error);
        dmSent = "❌ **DM Not Sent.**";
      }

      const embed = new EmbedBuilder()
        .setColor("#4ea554")
        .setTitle("Success")
        .addFields(
          { name: "User Warned:", value: `${targetUser} (${targetUser.id})`, inline: true },
          { name: "Moderator:", value: `${interaction.user} (${interaction.user.id})`, inline: true },
          { name: "Reason:", value: `\`${reason}\``, inline: true },
          { name: "DM Status:", value: dmSent, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

        let logChannels = {};
        if (fs.existsSync(logChannelsPath)) {
            logChannels = JSON.parse(fs.readFileSync(logChannelsPath, "utf-8"));
        }
        
        const logChannelId = logChannels[interaction.guild.id];
        if (logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder(embed.data)
                    .setTitle("Warn Log")
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
            type: "Warning",
            reason: reason,
            moderator: interaction.user.id,
            timestamp: Math.floor(Date.now() / 1000),
        });

        fs.writeFileSync(logsFilePath, JSON.stringify(modLogs, null, 2));
    } catch (error) {
      console.error("Error handling warn command:", error);
      await interaction.reply({ content: "An error occurred while warning the user.", ephemeral: true });
    }
  },

  name: "warn",
  description: "Warn a user for inappropriate behavior.",
  options: [
    {
      name: "user",
      description: "The user to warn.",
      type: 6,
      required: true,
    },
    {
      name: "reason",
      description: "Reason for the warning.",
      type: 3,
      required: false,
    },
  ],
};
