const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "../economy.json");
const ALLOWED_USER_ID = "";

function loadEconomy() {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function saveEconomy(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

module.exports = {
  name: "balance-add",
  description: "Add money to a user's balance.",
  options: [
    {
      name: "userid",
      description: "The ID of the user to give money to",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "amount",
      description: "The amount to add to their balance",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],

  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.user.id !== ALLOWED_USER_ID) {
      return interaction.editReply("❌ You do not have permission to use this command.");
    }

    const userId = interaction.options.getString("userid");
    const amount = interaction.options.getInteger("amount");

    if (amount <= 0) {
      return interaction.editReply("Amount must be greater than 0.");
    }

    const db = loadEconomy();

    if (!db[userId]) {
      db[userId] = {
        balance: 0,
        cooldowns: {},
      };
    }

    db[userId].balance += amount;
    saveEconomy(db);

    const embed = new EmbedBuilder()
      .setColor("Grey")
      .setTitle("💸 Balance Updated")
      .setDescription(`Successfully added **$${amount}** to <@${userId}>'s balance.`)
      .setTimestamp()
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    await interaction.editReply({ embeds: [embed] });
  },
};
