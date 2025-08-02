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
        content: "❌ You must specify a role to lock.",
        ephemeral: true
      });
    }

    try {
      const currentPermissions = targetChannel.permissionOverwrites.cache.get(targetRole.id);
      if (currentPermissions && currentPermissions.deny.has(PermissionFlagsBits.SendMessages)) {
        return await interaction.reply({ 
          content: `🔒 The role <@&${targetRole.id}> is already locked in <#${targetChannel.id}>.`, 
          ephemeral: true 
        });
      }

      await targetChannel.permissionOverwrites.edit(targetRole.id, {
        SendMessages: false
      });

      const confirmationEmbed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("Channel Locked")
        .setDescription(`<#${targetChannel.id}> has been locked for <@&${targetRole.id}>.`)
        .addFields({ name: "Reason", value: reason })
        .setTimestamp()
        .setFooter({ text: `Locked by ${interaction.user.tag}` });

      await interaction.reply({ embeds: [confirmationEmbed] });

      const lockNoticeEmbed = new EmbedBuilder()
        .setColor("#a54e4e")
        .setTitle("Channel Locked")
        .setDescription(`🔒 This channel has been locked.`)
        .addFields({ name: "Reason", value: reason })
        .setTimestamp();

      await targetChannel.send({ embeds: [lockNoticeEmbed] });

    } catch (error) {
      console.error("Error locking the channel:", error);
      await interaction.reply({ 
        content: "❌ Failed to lock the channel. Make sure I have the correct permissions.", 
        ephemeral: true 
      });
    }
  },

  name: "lock",
  description: "Locks a channel by denying send message permissions for a specific role.",
  options: [
    {
      name: "channel",
      description: "The channel to lock (defaults to the current one).",
      type: 7,
      required: true,
    },
    {
      name: "role",
      description: "The role to lock (denies send message permissions).",
      type: 8,
      required: true,
    },
    {
      name: "reason",
      description: "Reason for locking the channel.",
      type: 3,
      required: false,
    },
  ],
};
