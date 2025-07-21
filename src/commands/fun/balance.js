const {
    Client,
    Interaction,
    EmbedBuilder,
    ApplicationCommandOptionType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "../economy.json");

function getBalance(userId) {
    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    return db[userId]?.balance || 0;
}

module.exports = {
    name: "balance",
    description: "Check your or another user's balance.",
    options: [
        {
            name: "user",
            description: "The user to check balance for.",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const targetUser = interaction.options.getUser("user") || interaction.user;
            const balance = getBalance(targetUser.id);

            const embed = new EmbedBuilder()
                .setColor("Grey")
                .setTitle(`${targetUser.username}'s Balance`)
                .setDescription(`${targetUser.id === interaction.user.id ? "You have" : "They have"} **$${balance}**.`)
                .setTimestamp()
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error("Balance error:", err);
            await interaction.editReply("Something went wrong fetching the balance.");
        }
    },
};
