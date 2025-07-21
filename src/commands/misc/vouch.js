const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const dbPath = path.resolve(__dirname, "../vouches.json");
const VOUCH_LOG_CHANNEL_ID = ""; // Replace with your channel ID

function loadDB() {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function generateVouchId() {
  return crypto.randomBytes(4).toString("hex");
}

module.exports = {
  name: "vouch",
  description: "Submit a vouch for someone you've helped.",
  options: [
    {
      name: "helped_id",
      description: "The User ID of the person you helped",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "problem",
      description: "What was the problem you helped with?",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "solution",
      description: "How did you solve it?",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "picture_links",
      description: "Image link(s) as proof",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const helpedUser = interaction.options.getUser("helped_id");
    const problem = interaction.options.getString("problem");
    const solution = interaction.options.getString("solution");
    const pictureLinks = interaction.options.getString("picture_links");
    const db = loadDB();

    const vouchId = generateVouchId();
    const logChannel = client.channels.cache.get(VOUCH_LOG_CHANNEL_ID);

    const logEmbed = new EmbedBuilder()
      .setColor("Grey")
      .setTitle("📨 New Vouch Submitted")
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: "Vouch ID", value: `\`${vouchId}\`` },
        { name: "User Vouching", value: `<@${interaction.user.id}>` },
        { name: "User Helped", value: `<@${helpedUser.id}>` },
        { name: "Problem", value: problem },
        { name: "Solution", value: solution },
        { name: "Proof", value: pictureLinks },
      )
      .setFooter({
        text: `Submitted by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    if (logChannel) {
      const sentMessage = await logChannel.send({ embeds: [logEmbed] });
      db[vouchId] = {
        id: vouchId,
        helpedId: helpedUser.id,
        helperId: interaction.user.id,
        problem,
        solution,
        pictureLinks,
        status: "pending",
        submittedAt: Date.now(),
        logChannelId: logChannel.id,
        logMessageId: sentMessage.id,
      };
    } else {
      db[vouchId] = {
        id: vouchId,
        helpedId: helpedUser.id,
        helperId: interaction.user.id,
        problem,
        solution,
        pictureLinks,
        status: "pending",
        submittedAt: Date.now(),
      };
    }

    saveDB(db);

    await interaction.editReply({
      content: `✅ Vouch submitted successfully for <@${helpedUser.id}>. It has been logged and is pending approval.`,
    });
  },
};
