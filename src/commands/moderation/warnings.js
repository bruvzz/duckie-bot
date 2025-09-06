const { 
  Client, 
  Interaction, 
  EmbedBuilder, 
  PermissionsBitField, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} = require("discord.js");
const fs = require("fs");
const path = require("path");

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

      if (!targetUser) {
        return await interaction.reply({ content: "Please provide a valid user.", ephemeral: true });
      }

      let modLogs = {};
      if (fs.existsSync(logsFilePath)) {
        modLogs = JSON.parse(fs.readFileSync(logsFilePath));
      }

      const warnings = modLogs[targetUser.id];

      if (!warnings || warnings.length === 0) {
        return await interaction.reply({ content: `${targetUser.tag} has no warnings.`, ephemeral: true });
      }

      const pageSize = 5;
      let page = 0;

      const getEmbed = (page) => {
        const embed = new EmbedBuilder()
          .setColor("Yellow")
          .setTitle(`Warnings for ${targetUser.tag}`)
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: `Page ${page + 1} of ${Math.ceil(warnings.length / pageSize)}` })
          .setTimestamp();

        const start = page * pageSize;
        const end = start + pageSize;
        const pageWarnings = warnings.slice(start, end);

        pageWarnings.forEach(w => {
          embed.addFields({
            name: `⚠️ #${w.warnId}`,
            value: `**Reason:** \`${w.reason}\`\n**Moderator:** <@${w.moderator}>\n**Date:** <t:${w.timestamp}:F>`,
          });
        });

        return embed;
      };

      const getRow = (page) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled((page + 1) * pageSize >= warnings.length)
        );
      };

      const message = await interaction.reply({ 
        embeds: [getEmbed(page)], 
        components: [getRow(page)], 
        fetchReply: true 
      });

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60_000,
      });

      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: "Only the command user can use these buttons.", ephemeral: true });
        }

        if (i.customId === "prev" && page > 0) {
          page--;
        } else if (i.customId === "next" && (page + 1) * pageSize < warnings.length) {
          page++;
        }

        await i.update({ 
          embeds: [getEmbed(page)], 
          components: [getRow(page)] 
        });
      });

      collector.on("end", async () => {
        await message.edit({ components: [] }).catch(() => {});
      });

    } catch (error) {
      console.error("Error handling warnings command:", error);
      if (!interaction.replied) {
        await interaction.reply({ content: "An error occurred while fetching warnings.", ephemeral: true });
      }
    }
  },

  name: "warnings",
  description: "View all warnings for a user.",
  options: [
    {
      name: "user",
      description: "The user whose warnings you want to view.",
      type: 6,
      required: true,
    },
  ],
};
