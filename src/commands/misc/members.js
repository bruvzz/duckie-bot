const { 
  Client, 
  Interaction, 
  ApplicationCommandOptionType, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} = require("discord.js");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const role = interaction.options.getRole("role");
    await interaction.deferReply();

    try {
      await interaction.guild.members.fetch();
      
      const members = role.members.map(m => `• ${m.user.tag} (\`${m.id}\`)`);
      
      if (members.length === 0) {
        return await interaction.editReply({ 
          content: `❌ No members found with the role ${role}.` 
        });
      }

      const pageSize = 90;
      const totalPages = Math.ceil(members.length / pageSize);
      let currentPage = 0;

      const generateEmbed = (page) => {
        const start = page * pageSize;
        const end = start + pageSize;
        const currentMembers = members.slice(start, end);

        const description = currentMembers.join("\n");

        return new EmbedBuilder()
          .setTitle(`Members with Role: ${role.name}`)
          .setColor(role.color || "Grey")
          .setDescription(description.length > 4000 ? description.slice(0, 3997) + "..." : description)
          .setFooter({ 
            text: `Page ${page + 1} of ${totalPages} • Total Members: ${members.length}`,
            iconURL: interaction.guild.iconURL({ dynamic: true }) 
          })
          .setTimestamp();
      };

      const generateButtons = (page) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev_members")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("next_members")
            .setLabel("Next")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages - 1)
        );
      };

      const initialMessage = await interaction.editReply({
        embeds: [generateEmbed(currentPage)],
        components: totalPages > 1 ? [generateButtons(currentPage)] : [],
      });

      if (totalPages > 1) {
        const collector = initialMessage.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 300000, // 5 minutes
        });

        collector.on("collect", async (i) => {
          if (i.user.id !== interaction.user.id) {
            return i.reply({ content: "This menu isn't for you!", ephemeral: true });
          }

          if (i.customId === "prev_members") currentPage--;
          if (i.customId === "next_members") currentPage++;

          await i.update({
            embeds: [generateEmbed(currentPage)],
            components: [generateButtons(currentPage)],
          });
        });

        collector.on("end", () => {
          const disabledButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("prev_members")
              .setLabel("Previous")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("next_members")
              .setLabel("Next")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true)
          );
          interaction.editReply({ components: [disabledButtons] }).catch(() => {});
        });
      }

    } catch (error) {
      console.error("Error in members command:", error);
      await interaction.editReply({ content: "An error occurred while fetching members." });
    }
  },

  name: "members",
  description: "List all members with a specific role.",
  options: [
    {
      name: "role",
      description: "The role to list members for.",
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
  ],
};
