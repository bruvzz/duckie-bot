const {
    Client,
    Interaction,
    EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "../economy.json");
const cooldownPath = path.resolve(__dirname, "../cooldowns.json");

const COOLDOWN = 2 * 60 * 1000;

function loadJson(path) {
    if (!fs.existsSync(path)) fs.writeFileSync(path, "{}");
    return JSON.parse(fs.readFileSync(path, "utf8"));
}

function saveJson(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "work",
    description: "Do some work to earn money.",

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const userId = interaction.user.id;
            const cooldowns = loadJson(cooldownPath);

            if (cooldowns.work?.[userId] && Date.now() < cooldowns.work[userId]) {
                const remaining = Math.ceil((cooldowns.work[userId] - Date.now()) / 1000);
                return await interaction.editReply(`You need to wait **${remaining}** more seconds before working again.`);
            }

            const amount = Math.floor(Math.random() * 201) + 50;
            const db = loadJson(dbPath);
            if (!db[userId]) db[userId] = { balance: 0, lastDaily: 0 };
            db[userId].balance += amount;

            cooldowns.work = cooldowns.work || {};
            cooldowns.work[userId] = Date.now() + COOLDOWN;

            saveJson(dbPath, db);
            saveJson(cooldownPath, cooldowns);

            const embed = new EmbedBuilder()
                .setColor("Grey")
                .setDescription(`You worked and earned **$${amount}**!`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error("Work error:", err);
            await interaction.editReply("Something went wrong while working.");
        }
    },
};
