const { 
  Client, 
  Interaction, 
  PermissionFlagsBits, 
  EmbedBuilder, 
} = require("discord.js");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({ 
        content: "❌ You don't have permission to use this command.", 
        ephemeral: true 
      });
    }

    const targetChannel = interaction.options.getChannel("channel") || interaction.channel;
    const targetRole = interaction.options.getRole("role");
    const reason = interaction.options.getString("reason") || "N/A";

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({ 
        content: "❌ I need the **Manage Channels** permission to execute this command!", 
        ephemeral: true 
      });
    }

    if (!targetRole) {
      return await interaction.reply({
        content: "❌ You must specify a role to unlock.",
        ephemeral: true
      });
    }

    try {
      const currentPermissions = targetChannel.permissionOverwrites.cache.get(targetRole.id);
      if (currentPermissions && !currentPermissions.deny.has(PermissionFlagsBits.SendMessages)) {
        return await interaction.reply({ 
          content: `🔓 The role <@&${targetRole.id}> is already unlocked in <#${targetChannel.id}>.`, 
          ephemeral: true 
        });
      }

      await targetChannel.permissionOverwrites.edit(targetRole.id, {
        SendMessages: true
      });

      const confirmationEmbed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("Channel Unlocked")
        .setDescription(`<#${targetChannel.id}> has been unlocked for <@&${targetRole.id}>.`)
        .addFields({ name: "Reason", value: reason })
        .setTimestamp()
        .setFooter({ text: `Unlocked by ${interaction.user.tag}` });

      await interaction.reply({ embeds: [confirmationEmbed] });

      const unlockNoticeEmbed = new EmbedBuilder()
        .setColor("#4ea554")
        .setTitle("🔓 Channel Unlocked")
        .setDescription(`This channel has been unlocked.`)
        .addFields({ name: "Reason", value: reason })
        .setTimestamp();

      await targetChannel.send({ embeds: [unlockNoticeEmbed] });

    } catch (error) {
      console.error("Error unlocking the channel:", error);
      await interaction.reply({ 
        content: "❌ Failed to unlock the channel. Make sure I have the correct permissions.", 
        ephemeral: true 
      });
    }
  },

  name: "unlock",
  description: "Unlocks a channel by restoring send message permissions for a specific role.",
  options: [
    {
      name: "channel",
      description: "The channel to unlock (defaults to the current one).",
      type: 7,
      required: true,
    },
    {
      name: "role",
      description: "The role to unlock (restores send message permissions).",
      type: 8,
      required: true,
    },
    {
      name: "reason",
      description: "Reason for unlocking the channel.",
      type: 3,
      required: false,
    },
  ],
};
