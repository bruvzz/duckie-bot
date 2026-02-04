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
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

const REQUIRED_ROLE_ID = "";

module.exports = {
  name: "vouch-deny",
  description: "Deny a vouch by ID.",
  options: [
    {
      name: "vouch_id",
      description: "The ID of the vouch to deny",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "reason",
      description: "Reason for denying the vouch",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
      return interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const vouchId = interaction.options.getString("vouch_id");
    const reason = interaction.options.getString("reason");
    const db = loadDB();

    if (!db[vouchId]) {
      return interaction.editReply({ content: "❌ Vouch ID not found." });
    }

    db[vouchId].status = "denied";
    db[vouchId].deniedAt = Date.now();
    db[vouchId].deniedReason = reason;
    db[vouchId].deniedBy = interaction.user.id;
    saveDB(db);
      
    const submitterId = db[vouchId].helperId;

    if (submitterId) {
      try {
        const user = await client.users.fetch(submitterId);

        const dmEmbed = new EmbedBuilder()
          .setColor("#eb6060")
          .setTitle("❌ Your Vouch Was Denied")
          .setDescription(
            `Your vouch for <@${db[vouchId].helpedId}> has been **denied**.`
          )
          .addFields(
            { name: "Vouch ID", value: `\`${vouchId}\`` },
            { name: "Reviewed By", value: `<@${interaction.user.id}>` },
            { name: "Reason", value: reason }
          )
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] });
      } catch {
      }
    }


    if (db[vouchId].logChannelId && db[vouchId].logMessageId) {
      try {
        const channel = await client.channels.fetch(db[vouchId].logChannelId);
        const message = await channel.messages.fetch(db[vouchId].logMessageId);
        const embed = message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(embed)
          .setTitle("❌ Vouch Denied")
          .setColor("#eb6060")
          .addFields(
            { name: "Reviewed By", value: `<@${interaction.user.id}>` },
            { name: "Denied Reason", value: reason }
          );
        await message.edit({ embeds: [updatedEmbed] });
      } catch (err) {
        console.error("Failed to update vouch message:", err);
      }
    }

    await interaction.editReply({ content: `❌ Vouch \`${vouchId}\` denied.` });
  },
};
