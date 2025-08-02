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
    const allowedUserId = ""; // Replace with your Discord user ID

    if (interaction.user.id !== allowedUserId) {
      return await interaction.reply({ content: "❌ You can't run this command, fuck nigga.", ephemeral: true });
    }

    try {
      const channel = interaction.options.getChannel("channel") || interaction.channel;

      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return await interaction.reply({ content: "I need the **Manage Channels** permission to execute this command!", ephemeral: true });
      }

      if (!channel) {
        return await interaction.reply({ content: "❌ Unable to find the specified channel.", ephemeral: true });
      }

      const position = channel.position;
      const parent = channel.parent;
      const topic = channel.topic;
      const permissions = channel.permissionOverwrites.cache.map(overwrite => ({
        id: overwrite.id,
        allow: overwrite.allow.toArray(),
        deny: overwrite.deny.toArray()
      }));

      const newChannel = await channel.clone({
        parent: parent ? parent.id : null,
        position,
        topic,
        permissionOverwrites: permissions
      });

      await channel.delete(`Restored by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("Channel Restored")
        .setDescription(`Salutations. If you have any questions or concerns, please forward them to someone on our Staff Team. Thank you so much for your patience and support!`)
        .setThumbnail(interaction.guild.iconURL())
        .setTimestamp();

      await newChannel.send({ embeds: [embed] });

      await interaction.reply({ content: `✅ Successfully restored <#${newChannel.id}>!`, ephemeral: true });

    } catch (error) {
      console.error("Error nuking the channel:", error);
      await interaction.reply({ content: "❌ Failed to restore the channel. Make sure I have the correct permissions.", ephemeral: true });
    }
  },

  name: "nuke",
  description: "Nukes a channel (deletes & recreates it with the same settings).",
  options: [
    {
      name: "channel",
      description: "The channel to nuke (defaults to the current one).",
      type: 7,
      required: false,
    },
  ],
};
