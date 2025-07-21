const {
    Client,
    Interaction,
    EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "../economy.json");
const cooldownPath = path.resolve(__dirname, "../cooldowns.json");
const COOLDOWN = 60 * 1000;

function safeLoadJson(filePath) {
    try {
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "{}");
        const data = fs.readFileSync(filePath, "utf8");
        return data.trim() ? JSON.parse(data) : {};
    } catch (err) {
        console.error(`Error reading JSON from ${filePath}:`, err);
        return {};
    }
}

function saveJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const scenarios = [
    "You were on the side of the street and saw **Selena Gomez**.",
    "You begged your local pizza guy and he actually felt bad.",
    "You tripped in front of a **grandma**, she gave you a pity coin.",
    "You barked at a rich guy's dog. The dog gave you money. What?",
    "You fake-cried in public and someone filmed it. You went viral.",
    "You asked a toddler for change. They gave you **Monopoly money**.",
    "You begged your ex. They blocked you, but sent $5 first.",
    "You acted homeless near a **Tesla charging station**.",
    "You serenaded strangers with a kazoo. They tipped out of fear.",
    "You begged MrBeast. He said 'no', but his cameraman gave you something.",
    "You panhandled in a Minecraft server. Someone actually paid you.",
    "You stood outside Target holding a 'need Robux' sign.",
    "You photoshopped a sad face onto your profile pic. Got sympathy cash.",
    "You yelled 'free V-Bucks' and someone threw coins at you to stop.",
    "You pretended to be a lost NPC. A gamer paid you to leave.",
    "You cried near a vending machine. A guy gave you change thinking you were stuck.",
    "You did a TikTok dance in public. Got paid to never do it again.",
    "You begged a Discord mod. They muted you, but also sent $3.",
    "You DM'd Elon Musk asking for 5 bucks. He sent Dogecoin instead.",
    "You pretended to be a wall. Someone taped $2 to you as art."
];

module.exports = {
    name: "beg",
    description: "Beg for money like a broke legend.",

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const userId = interaction.user.id;
            const cooldowns = safeLoadJson(cooldownPath);
            const db = safeLoadJson(dbPath);

            const now = Date.now();
            cooldowns.beg = cooldowns.beg || {};
            const lastUsed = cooldowns.beg[userId] || 0;
            const timeLeft = lastUsed + COOLDOWN - now;

            if (timeLeft > 0) {
                const seconds = Math.ceil(timeLeft / 1000);
                return await interaction.editReply(`You must wait **${seconds}** more seconds before begging again.`);
            }

            const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
            const amount = Math.random() < 0.2 ? 0 : Math.floor(Math.random() * 50) + 1;

            if (!db[userId]) db[userId] = { balance: 0, lastDaily: 0 };
            db[userId].balance += amount;
            cooldowns.beg[userId] = now;

            saveJson(dbPath, db);
            saveJson(cooldownPath, cooldowns);

            const resultText = amount === 0
                ? `You begged and got **nothing**. 😭`
                : `You begged and got **$${amount}**. 💰`;

            const embed = new EmbedBuilder()
                .setColor("#999999")
                .setDescription(`${scenario}\n\n${resultText}`)
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error("Beg command error:", err);
            await interaction.editReply("Something went wrong while begging.");
        }
    },
};
