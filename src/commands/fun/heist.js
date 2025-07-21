const {
    Client,
    Interaction,
    EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "../economy.json");

function loadDB() {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function saveDB(db) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function ensureUser(db, userId) {
    if (!db[userId]) {
        db[userId] = { balance: 0, cooldowns: {} };
    } else if (!db[userId].cooldowns) {
        db[userId].cooldowns = {};
    }
}

function updateBalance(userId, amount) {
    const db = loadDB();
    ensureUser(db, userId);
    db[userId].balance += amount;
    saveDB(db);
}

function getBalance(userId) {
    const db = loadDB();
    return db[userId]?.balance || 0;
}

function canUseHeist(userId) {
    const db = loadDB();
    ensureUser(db, userId);
    const lastUsed = db[userId].cooldowns.heist || 0;
    return Date.now() - lastUsed >= 3600000;
}

function setHeistCooldown(userId) {
    const db = loadDB();
    ensureUser(db, userId);
    db[userId].cooldowns.heist = Date.now();
    saveDB(db);
}

module.exports = {
    name: "heist",
    description: "Try your luck in a big-money heist (50/50 chance).",
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const userId = interaction.user.id;

            if (!canUseHeist(userId)) {
                const db = loadDB();
                const lastUsed = db[userId].cooldowns.heist;
                const remaining = 3600000 - (Date.now() - lastUsed);
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);

                return await interaction.editReply({
                    content: `You must wait ${minutes}m ${seconds}s before trying another heist.`,
                });
            }

            const win = Math.random() < 0.5;
            let message;
            let amount = 0;

            if (win) {
                amount = Math.floor(Math.random() * 45001) + 5000; // $5,000 – $50,000
                updateBalance(userId, amount);
                message = `Congratulations. You pulled off a successful heist and made **$${amount.toLocaleString()}**.`;
            } else {
                message = `You got caught during the heist and made **nothing**. Better luck next time.`;
            }

            setHeistCooldown(userId);

            const embed = new EmbedBuilder()
                .setColor("Grey")
                .setTitle("Heist Results")
                .setDescription(message)
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error("Heist error:", err);
            await interaction.editReply("Something went wrong during the heist.");
        }
    },
};
