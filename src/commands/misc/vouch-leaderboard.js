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

const hasSupportRole = (member) =>
  member?.roles?.cache?.some((r) => r.name.toLowerCase() === "support");

module.exports = {
  name: "vouch-leaderboard",
  description: "View the vouch leaderboard.",

  /**
   * @param {Client} client
   * @param {Interaction} interaction}
   */
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const db = loadDB();

    const counts = {};
    for (const vouch of Object.values(db)) {
      if (vouch?.status === "approved") {
        const delta = vouch.negative ? -1 : 1;
        const id = String(vouch.helperId);
        counts[id] = (counts[id] || 0) + delta;
      }
    }

    const sorted = Object.entries(counts)
      .map(([userId, count]) => ({ userId, count }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);

    if (!sorted.length) {
      return interaction.editReply("No approved vouches found.");
    }

    const ids = sorted.map((x) => x.userId);
    let membersMap = new Map();
    try {
      const fetched = await interaction.guild.members.fetch({ user: ids });
      membersMap = fetched;
    } catch {
      membersMap = new Map();
    }

    const rows = [];
    let rank = 1;
    for (const { userId, count } of sorted) {
      const member = membersMap.get(userId);
      if (!member) continue;
      if (!hasSupportRole(member)) continue;

      const vouchWord = count === 1 ? "vouch" : "vouches";
      rows.push(`**${rank}.** <@${userId}> — **${count}** ${vouchWord}`);
      rank++;
    }

    if (!rows.length) {
      return interaction.editReply("No eligible members found on the leaderboard.");
    }

    const perPage = 10;
    const pages = [];
    for (let i = 0; i < rows.length; i += perPage) {
      const description = rows.slice(i, i + perPage).join("\n");
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
      if (i.customId === "prev" && currentPage > 0) currentPage--;
      else if (i.customId === "next" && currentPage < pages.length - 1) currentPage++;

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
