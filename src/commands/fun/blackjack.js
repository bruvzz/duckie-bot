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

function getBalance(userId) {
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  return db[userId]?.balance || 0;
}

function updateBalance(userId, amount) {
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  if (!db[userId]) db[userId] = { balance: 0 };
  db[userId].balance += amount;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

module.exports = {
  name: "blackjack",
  description: "Play a fun game of Blackjack!",
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
    await interaction.deferReply();

    const bet = interaction.options.getInteger("bet");
    const userId = interaction.user.id;
    const balance = getBalance(userId);

    if (bet < 100) {
      return await interaction.editReply("You must bet at least $100.");
    }

    if (balance < bet) {
      return await interaction.editReply("You don't have enough money to place that bet.");
    }

    updateBalance(userId, -bet);

    const getCard = () => Math.floor(Math.random() * 10) + 2;
    let playerHand = [getCard(), getCard()];
    let dealerHand = [getCard(), getCard()];
    let gameOver = false;

    const calculateTotal = (hand) => hand.reduce((a, b) => a + b, 0);
    const getHandString = (hand) => hand.join(", ");

    const createEmbed = (end = false, result = "") => {
      const embed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("🃏 Blackjack")
        .addFields(
          {
            name: "Your Hand",
            value: `${getHandString(playerHand)} (Total: **${calculateTotal(playerHand)}**)`,
            inline: false,
          },
          {
            name: end ? "Dealer's Hand" : "Dealer Shows",
            value: end
              ? `${getHandString(dealerHand)} (Total: **${calculateTotal(dealerHand)}**)`
              : `${dealerHand[0]}, ?`,
            inline: false,
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      if (end && result) embed.setDescription(`🎯 **${result}**`);
      return embed;
    };

    const getButtons = (timerLeft = 60) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("hit").setLabel("Hit").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("stand").setLabel("Stand").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("countdown")
          .setLabel(`${timerLeft}s`)
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
      );

    let timer = 60;
    let message = await interaction.editReply({
      embeds: [createEmbed()],
      components: [getButtons(timer)],
    });

    const interval = setInterval(async () => {
      timer--;
      if (gameOver || timer <= 0) {
        clearInterval(interval);
        return;
      }
      try {
        await message.edit({ components: [getButtons(timer)] });
      } catch (e) {}
    }, 1000);

    const filter = (i) => i.user.id === userId;
    const collector = message.createMessageComponentCollector({ filter, time: timer * 1000 });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      if (i.customId === "hit") {
        playerHand.push(getCard());
        const total = calculateTotal(playerHand);
        if (total > 21) {
          gameOver = true;
          collector.stop("bust");
          return await interaction.editReply({
            embeds: [createEmbed(true, `Busted - Dealer Wins. You lost $${bet}`)],
            components: [],
          });
        } else {
          await interaction.editReply({ embeds: [createEmbed()], components: [getButtons(timer)] });
        }
      }

      if (i.customId === "stand") {
        gameOver = true;
        collector.stop("stand");

        while (calculateTotal(dealerHand) < 17) {
          dealerHand.push(getCard());
        }

        const dealerTotal = calculateTotal(dealerHand);
        const playerTotal = calculateTotal(playerHand);

        let result = "Draw";
        if (dealerTotal > 21 || playerTotal > dealerTotal) {
          result = `You Won! You earned $${bet * 2}`;
          updateBalance(userId, bet * 2);
        } else if (playerTotal < dealerTotal) {
          result = `Dealer Wins. You lost $${bet}`;
        } else {
          updateBalance(userId, bet);
        }

        await interaction.editReply({
          embeds: [createEmbed(true, result)],
          components: [],
        });
      }
    });

    collector.on("end", async (_collected, reason) => {
      gameOver = true;
      clearInterval(interval);

      if (reason === "time") {
        await interaction.editReply({
          embeds: [createEmbed(true, "Game ended due to inactivity.")],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("hit")
                .setLabel("Hit")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId("stand")
                .setLabel("Stand")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId("countdown")
                .setLabel("0s")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true)
            ),
          ],
        });
      }
    });
  },
};
