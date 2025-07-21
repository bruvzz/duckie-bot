const {
  Client,
  Interaction,
  EmbedBuilder,
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

    // Count approved vouches per helper user
    const counts = {};
    for (const vouch of Object.values(db)) {
      if (vouch.status === "approved") {
        counts[vouch.helperId] = (counts[vouch.helperId] || 0) + 1;
      }
    }

    // Convert to array and sort descending
    const sorted = Object.entries(counts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count);

    if (sorted.length === 0) {
      return interaction.editReply("No approved vouches found.");
    }

    let description = "";
    let rank = 1;

    for (let i = 0; i < sorted.length && rank <= 10; i++) {
      const { userId, count } = sorted[i];

      try {
        const member = await interaction.guild.members.fetch(userId);
        if (member) {
          const vouchWord = count === 1 ? "vouch" : "vouches";
          description += `**${rank}.** <@${userId}> — **${count}** ${vouchWord}\n`;
          rank++;
        }
      } catch (err) {
        // Member not in guild
      }
    }

    if (!description) {
      return interaction.editReply("No eligible members found on the leaderboard.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🏆 Vouch Leaderboard")
      .setColor("Grey")
      .setDescription(description)
      .setTimestamp()
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    await interaction.editReply({ embeds: [embed] });
  },
};
