const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
      try {
          await interaction.deferReply();

          if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
              return await interaction.editReply("You don't have permission to ban members.");
          }

          const userId = interaction.options.getString("userid");
          const reason = interaction.options.getString("reason") || "N/A";

          if (!userId) {
              return await interaction.editReply("Please provide a valid user ID.");
          }

          const user = await client.users.fetch(userId).catch(() => null);

          if (!user) {
              return await interaction.editReply("Could not find a user with that ID.");
          }

          await interaction.guild.members.ban(user.id, { reason });

          const embed = new EmbedBuilder()
              .setColor("#4ea554")
              .setTitle("Success")
              .setThumbnail(user.displayAvatarURL({ dynamic: true }))
              .setTimestamp()
              .addFields(
                  {
                      name: "User Banned:",
                      value: `<@${user.id}> (${user.id})`,
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

          await interaction.editReply({ embeds: [embed] });
      } catch (error) {
          console.error("Error banning user:", error);
          await interaction.editReply("An error occurred while trying to ban the user.");
      }
  },

  name: "ban",
  description: "Ban a member from the server.",
  options: [
      {
          name: "userid",
          description: "The ID of the user to ban.",
          type: ApplicationCommandOptionType.String,
          required: true,
      },
      {
          name: "reason",
          description: "The reason for banning the user.",
          type: ApplicationCommandOptionType.String,
          required: false,
      },
  ],
};
