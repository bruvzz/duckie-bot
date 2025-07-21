const {
  Client,
  Interaction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationCommandOptionType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "../economy.json");

function loadEconomy() {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function saveEconomy(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: "roulette",
  description: "Play a game of roulette.",
  options: [
    {
      name: "bet",
      description: "How much would you like to bet?",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],

  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const userId = interaction.user.id;
    const betAmount = interaction.options.getInteger("bet");

    if (betAmount < 100) {
      return interaction.reply({
        content: "You must bet at least $100.",
        ephemeral: true,
      });
    }

    const economy = loadEconomy();
    const userBalance = economy[userId]?.balance || 0;

    if (userBalance < betAmount) {
      return interaction.reply({
        content: "You don't have enough money to place that bet.",
        ephemeral: true,
      });
    }

    const colorButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("red")
        .setLabel("🟥 Red")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("black")
        .setLabel("⬛ Black")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("green")
        .setLabel("🟩 Green")
        .setStyle(ButtonStyle.Success)
    );

    const replyMessage = await interaction.reply({
      content: "🎯 Choose a color to bet on:",
      components: [colorButtons],
      fetchReply: true,
    });

    const collector = replyMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === userId,
      time: 15000,
    });

    collector.on("collect", async (btn) => {
      await btn.deferUpdate();
      collector.stop();

      const choice = btn.customId;
      const outcome = Math.floor(Math.random() * 37); // 0-36
      let resultColor = "green";

      if (outcome === 0) resultColor = "green";
      else if (outcome % 2 === 0) resultColor = "black";
      else resultColor = "red";

      const resultEmoji = resultColor === "red" ? "🟥" : resultColor === "black" ? "⬛" : "🟩";
      const choiceEmoji = choice === "red" ? "🟥" : choice === "black" ? "⬛" : "🟩";

      let won = false;
      if (choice === resultColor) {
        won = true;
        economy[userId].balance = (economy[userId].balance || 0) + betAmount;
      } else {
        economy[userId].balance = (economy[userId].balance || 0) - betAmount;
      }

      saveEconomy(economy);

      const resultEmbed = new EmbedBuilder()
        .setColor(won ? "Green" : "Red")
        .setTitle("🎰 Roulette")
        .addFields(
          { name: "You Chose", value: choiceEmoji, inline: true },
          { name: "Rolled", value: resultEmoji, inline: true },
          {
            name: "Result",
            value: won
              ? `✅ You won $${betAmount}!`
              : `❌ You lost $${betAmount}.`,
            inline: false,
          },
          {
            name: "New Balance",
            value: `**$${economy[userId].balance}**`,
            inline: false,
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.editReply({
        content: "",
        embeds: [resultEmbed],
        components: [],
      });
    });

    collector.on("end", async (_collected, reason) => {
      if (reason === "time") {
        await interaction.editReply({
          content: "⏰ Time's up! You didn't place a bet in time.",
          components: [],
        });
      }
    });
  },
};
