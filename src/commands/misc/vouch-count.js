const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "../vouches.json");

function loadDB() {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

module.exports = {
  name: "vouch-count",
  description: "Check how many vouches a user has.",
  options: [
    {
      name: "user",
      description: "The user to check vouch count for",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser("user") || interaction.user;
    const db = loadDB();

    const approvedCount = Object.values(db).filter(
      (v) => v.helperId === targetUser.id && v.status === "approved"
    ).length;

    const embed = new EmbedBuilder()
      .setColor("Grey")
      .setTitle(`${targetUser.username}'s Vouch Count`)
      .setDescription(`They have **${approvedCount}** vouch(es).`)
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
