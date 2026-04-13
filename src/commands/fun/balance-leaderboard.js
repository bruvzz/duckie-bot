const {
    Client,
    Interaction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const dbPath = path.resolve(__dirname, "../economy.json");
const REQUIRED_ROLE_ID = "";

async function getSortedLeaderboard(interaction) {
    if (!fs.existsSync(dbPath)) return [];
    
    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

    await interaction.guild.members.fetch();

    const sorted = Object.entries(db)
        .filter(([id, data]) => {
            const balance = data.balance || 0;
            if (balance <= 0) return false;

            const member = interaction.guild.members.cache.get(id);
            return member && member.roles.cache.has(REQUIRED_ROLE_ID);
        })
        .sort(([, a], [, b]) => (b.balance || 0) - (a.balance || 0))
        .map(([id, data], index) => ({
            id,
            balance: data.balance || 0,
            position: index + 1,
        }));
        
    return sorted;
}

function createEmbedPage(sorted, page, totalPages, interaction) {
    const start = (page - 1) * 10;
    const pageData = sorted.slice(start, start + 10);
    const description = pageData
        .map((entry, i) => `**#${entry.position}** <@${entry.id}> — \`$${entry.balance.toLocaleString()}\``)
        .join("\n");

    return new EmbedBuilder()
        .setColor("Grey")
        .setTitle("Balance Leaderboard")
        .setDescription(description || "*No eligible users found with a balance.*")
        .setFooter({
            text: `Page ${page} of ${totalPages} • Total: ${sorted.length} users`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();
}

module.exports = {
    name: "balance-leaderboard",
    description: "View the top staff members by balance.",

    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        await interaction.deferReply();

        const sorted = await getSortedLeaderboard(interaction);
        const totalPages = Math.ceil(sorted.length / 10) || 1;
        let currentPage = 1;

        const embed = createEmbedPage(sorted, currentPage, totalPages, interaction);

        const components = () => [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("previous")
                    .setLabel("Previous")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === 1),
                new ButtonBuilder()
                    .setCustomId("next")
                    .setLabel("Next")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === totalPages)
            ),
        ];

        const msg = await interaction.editReply({
            embeds: [embed],
            components: totalPages > 1 ? components() : [],
        });

        if (totalPages === 1) return;

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
        });

        collector.on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "This interaction isn’t for you.", ephemeral: true });
            }

            if (i.customId === "previous" && currentPage > 1) {
                currentPage--;
            } else if (i.customId === "next" && currentPage < totalPages) {
                currentPage++;
            }

            const newEmbed = createEmbedPage(sorted, currentPage, totalPages, interaction);
            await i.update({ embeds: [newEmbed], components: components() });
        });

        collector.on("end", async () => {
            const disabledComponents = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("previous")
                    .setLabel("Previous")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("next")
                    .setLabel("Next")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
            await interaction.editReply({ components: [disabledComponents] }).catch(() => {});
        });
    },
};
