const {
    Client,
    Interaction,
    EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "../economy.json");

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;

function loadJson(path) {
    if (!fs.existsSync(path)) fs.writeFileSync(path, "{}");
    return JSON.parse(fs.readFileSync(path, "utf8"));
}

function saveJson(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "daily",
    description: "Claim your daily reward.",

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const userId = interaction.user.id;
            const db = loadJson(dbPath);
            const userData = db[userId] || { balance: 0, lastDaily: 0 };

            const timeSinceLast = Date.now() - userData.lastDaily;
            if (timeSinceLast < DAILY_COOLDOWN) {
                const remaining = DAILY_COOLDOWN - timeSinceLast;
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

                return await interaction.editReply(`Sorry. You can claim your daily in **${hours}h ${minutes}m ${seconds}s**.`);
            }

            const reward = Math.floor(Math.random() * 401) + 100;
            userData.balance += reward;
            userData.lastDaily = Date.now();
            db[userId] = userData;

            saveJson(dbPath, db);

            const embed = new EmbedBuilder()
                .setColor("Grey")
                .setDescription(`Congratulations. You claimed your daily and earned **$${reward}**!`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error("Daily error:", err);
            await interaction.editReply("Something went wrong while claiming daily.");
        }
    },
};
