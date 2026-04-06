const {
  Client,
  Interaction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      await interaction.deferReply();

      const commandsPath = path.join(__dirname, "..");
      const categories = {};

      const categoryFolders = fs.readdirSync(commandsPath).filter(folder => 
        fs.lstatSync(path.join(commandsPath, folder)).isDirectory()
      );

      for (const folder of categoryFolders) {
        const commandFiles = fs.readdirSync(path.join(commandsPath, folder)).filter(file => file.endsWith(".js"));
        
        if (commandFiles.length === 0) continue;

        const categoryName = folder.charAt(0).toUpperCase() + folder.slice(1);
        categories[categoryName] = [];

        for (const file of commandFiles) {
          const command = require(path.join(commandsPath, folder, file));
          if (command.name && command.description) {
            categories[categoryName].push({
              name: command.name,
              description: command.description,
            });
          }
        }
      }

      const mainEmbed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("Help Menu")
        .setDescription("Welcome to the help menu! Use the dropdown below to explore commands by category.")
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: "Total Categories", value: `${Object.keys(categories).length}`, inline: true },
          { name: "Total Commands", value: `${Object.values(categories).flat().length}`, inline: true }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("help_category_select")
        .setPlaceholder("Choose a command category...")
        .addOptions(
          Object.keys(categories).map((cat) => ({
            label: cat,
            description: `View ${categories[cat].length} ${cat} commands`,
            value: cat.toLowerCase(),
            emoji: "📁"
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const response = await interaction.editReply({
        embeds: [mainEmbed],
        components: [row],
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300000, // 5 minutes
      });

      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: "This menu isn't for you!", ephemeral: true });
        }

        const selectedValue = i.values[0];
        const categoryKey = Object.keys(categories).find(k => k.toLowerCase() === selectedValue);
        const categoryCommands = categories[categoryKey];

        const categoryEmbed = new EmbedBuilder()
          .setColor("Blue")
          .setTitle(`${categoryKey} Commands`)
          .setDescription(`Here are the commands available in the **${categoryKey}** category:`)
          .setFooter({
            text: `Page 1/1 • Total: ${categoryCommands.length}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp();

        categoryCommands.forEach(cmd => {
          categoryEmbed.addFields({
            name: `\`/${cmd.name}\``,
            value: cmd.description || "No description provided.",
            inline: false
          });
        });

        await i.update({ embeds: [categoryEmbed] });
      });

      collector.on("end", () => {
        row.components[0].setDisabled(true).setPlaceholder("Help menu expired.");
        interaction.editReply({ components: [row] }).catch(() => {});
      });

    } catch (error) {
      console.error("Error in help command:", error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: "There was an error while executing this command!" });
      } else {
        await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
      }
    }
  },

  name: "help",
  description: "Displays a help menu with available commands.",
};
