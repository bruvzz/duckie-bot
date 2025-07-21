const {
  Client,
  Interaction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "windows",
  description: "Get the list of Roblox Windows Versions (Current and Future).",

  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      await interaction.deferReply();

      const fetchWindowsHash = async (url) => {
        const response = await fetch(url);
        return await response.json();
      };

      const currentData = await fetchWindowsHash("https://weao.xyz/api/versions/current");
      const futureData = await fetchWindowsHash("https://weao.xyz/api/versions/future");

      const createEmbed = (data, type) => {
        return new EmbedBuilder()
          .setTitle(`${type} Information`)
          .setColor("Grey")
          .setThumbnail("https://cdn.discordapp.com/attachments/1384045051482603605/1384045593533616179/112484-roblox-logo-pic-free-download-png-hq.png")
          .setTimestamp()
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .addFields(
            {
              name: `Hash:`,
              value: `\`${data["Windows"]}\``,
              inline: false,
            },
            {
              name: "Released:",
              value: data["WindowsDate"],
              inline: false,
            },
            {
              name: "Download:",
              value: `[Click To Download](https://rdd.weao.xyz/?channel=LIVE&binaryType=WindowsPlayer&version=${data["Windows"]})`,
              inline: false,
            }
          );
      };

      let timeLeft = 60;

      const getButtons = () =>
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("show_current")
            .setLabel("Current")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("show_future")
            .setLabel("Future")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("countdown")
            .setLabel(`${timeLeft}s`)
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
        );

      const promptEmbed = new EmbedBuilder()
        .setTitle("Which version would you like to see?")
        .setDescription("Click a button below to view the version information.")
        .setColor("Grey")
        .setTimestamp();

      let message = await interaction.editReply({
        embeds: [promptEmbed],
        components: [getButtons()],
      });

      const interval = setInterval(async () => {
        timeLeft--;
        if (timeLeft <= 0) return clearInterval(interval);
        try {
          await message.edit({
            components: [getButtons()],
          });
        } catch (e) {}
      }, 1000);

      const filter = (i) => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (btnInteraction) => {
        await btnInteraction.deferUpdate();
        clearInterval(interval);
        collector.stop();

        if (btnInteraction.customId === "show_current") {
          await interaction.editReply({
            embeds: [createEmbed(currentData, "Current")],
            components: [],
          });
        } else if (btnInteraction.customId === "show_future") {
          await interaction.editReply({
            embeds: [createEmbed(futureData, "Future")],
            components: [],
          });
        }
      });

      collector.on("end", async () => {
        clearInterval(interval);
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("show_current")
            .setLabel("Current")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("show_future")
            .setLabel("Future")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("countdown")
            .setLabel("0s")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
        );

        await interaction.editReply({ components: [disabledRow] });
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      await interaction.editReply("An error occurred while fetching the data.");
    }
  },
};
