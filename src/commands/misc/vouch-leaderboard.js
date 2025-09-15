const {
  Client,
  Interaction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "../vouches.json");

function loadDB() {
  if (!fs.existsSync(dbPath)) return {};
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

module.exports = {
  name: "vouch-leaderboard",
  description: "View the vouch leaderboard.",

  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const db = loadDB();

    const counts = {};
    for (const vouch of Object.values(db)) {
      if (vouch.status === "approved") {
        const value = vouch.negative ? -1 : 1;
        counts[vouch.helperId] = (counts[vouch.helperId] || 0) + value;
      }
    }

    const sorted = Object.entries(counts)
      .map(([userId, count]) => ({ userId, count }))
      .filter(({ count }) => count > 0)
      .sort((a, b) => b.count - a.count);

    if (sorted.length === 0) {
      return interaction.editReply("No approved vouches found.");
    }

    const perPage = 10;
    const pages = [];
    let rank = 1;

    for (let i = 0; i < sorted.length; i += perPage) {
      const chunk = sorted.slice(i, i + perPage);
      let description = "";

      for (const { userId, count } of chunk) {
        try {
          const member = await interaction.guild.members.fetch(userId);
          if (member) {
            const vouchWord = count === 1 ? "vouch" : "vouches";
            description += `**${rank}.** <@${userId}> — **${count}** ${vouchWord}\n`;
            rank++;
          }
        } catch {
          // Member not in guild or fetch failed, skip
        }
      }

      if (description) {
        const embed = new EmbedBuilder()
          .setTitle("🏆 Vouch Leaderboard")
          .setColor("Grey")
          .setDescription(description)
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp();

        pages.push(embed);
      }
    }

    if (!pages.length) {
      return interaction.editReply("No eligible members found on the leaderboard.");
    }

    let currentPage = 0;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pages.length === 1)
    );

    const message = await interaction.editReply({
      embeds: [pages[currentPage]],
      components: [row],
    });

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "prev" && currentPage > 0) {
        currentPage--;
      } else if (i.customId === "next" && currentPage < pages.length - 1) {
        currentPage++;
      }

      row.components[0].setDisabled(currentPage === 0);
      row.components[1].setDisabled(currentPage === pages.length - 1);

      await i.update({ embeds: [pages[currentPage]], components: [row] });
    });

    collector.on("end", async () => {
      row.components.forEach((btn) => btn.setDisabled(true));
      await message.edit({ components: [row] }).catch(() => {});
    });
  },
};
