const {
    Client,
    Interaction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ApplicationCommandOptionType,
} = require("discord.js");

module.exports = {
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const categories = {
                general: [
                    { name: "avatar", description: "Get the avatar of a user" },
                    { name: "github", description: "Get the GitHub profile and repository of the bot" },
                    { name: "help", description: "Shows this help message" },
                    { name: "membercount", description: "Get the member count of a server" },
                    { name: "ping", description: "Check the bot's and API latency" },
                    { name: "roles", description: "Displays a list of all roles in the server" },
                    { name: "serverinfo", description: "Displays information about the current server" },
                    { name: "uptime", description: "Get the bot's current uptime" },
                    { name: "weao", description: "Get the list of Roblox Windows Exploits" },
                    { name: "whois", description: "Get information about a user" },
                    { name: "windows", description: "Get the list of Roblox Windows Versions" },
                ],
                moderation: [
                    { name: "ban", description: "Ban a member from the server" },
                    { name: "kick", description: "Kick a member from the server" },
                    { name: "moderate-nickname", description: "Moderates a person's username using their User ID" },
                    { name: "purge", description: "Delete messages in the channel" },
                    { name: "set-logs", description: "Set the channel where moderation logs will be sent" },
                    { name: "slowmode", description: "Set a slowmode for a channel" },
                    { name: "timeout", description: "Timeout a user" },
                    { name: "toggle-role", description: "Toggle a server role for a user by their User ID" },
                    { name: "unban", description: "Unban a member from the server" },
                    { name: "untimeout", description: "UnTimeout a user" },
                ],
                fun: [
                    { name: "rps", description: "Play Rock Paper Scissors" },
                ],
            };

            const createCategoryEmbed = (category, page = 0) => {
                const embed = new EmbedBuilder()
                    .setColor("#4ea554")
                    .setTitle(`${category.charAt(0).toUpperCase() + category.slice(1)} Commands`)
                    .setFooter({
                        text: `Requested by ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                    })
                    .setTimestamp();

                const pageSize = 5;
                const start = page * pageSize;
                const end = start + pageSize;
                const commandsOnPage = categories[category].slice(start, end);

                commandsOnPage.forEach((cmd) => {
                    embed.addFields({
                        name: `/${cmd.name}`,
                        value: cmd.description,
                        inline: false,
                    });
                });

                const totalPages = Math.ceil(categories[category].length / pageSize);
                embed.setDescription(
                    `\nPage ${page + 1} / ${totalPages}`
                );

                return embed;
            };


            const categorySelectMenu = new StringSelectMenuBuilder()
                .setCustomId("categorySelect")
                .setPlaceholder("Select a category")
                .addOptions(
                    Object.keys(categories).map((category) => ({
                        label: category.charAt(0).toUpperCase() + category.slice(1),
                        value: category,
                    }))
                );

            const selectActionRow = new ActionRowBuilder().addComponents(categorySelectMenu);

            const createPaginationButtons = (category, page) => {
                const totalPages = Math.ceil(categories[category].length / 5);
                const buttons = [
                    new ButtonBuilder()
                        .setCustomId("prevPage")
                        .setLabel("Previous")
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId("nextPage")
                        .setLabel("Next")
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(page >= totalPages - 1),
                ];

                return new ActionRowBuilder().addComponents(...buttons);
            };

            let currentPage = 0;
            await interaction.editReply({
                embeds: [createCategoryEmbed("general", currentPage)],
                components: [selectActionRow, createPaginationButtons("general", currentPage)],
            });

            const filter = (buttonInteraction) =>
                buttonInteraction.user.id === interaction.user.id;

            const collector = interaction.channel.createMessageComponentCollector({
                filter,
                time: 60000,
            });

            collector.on("collect", async (buttonInteraction) => {
                await buttonInteraction.deferUpdate();

                const customId = buttonInteraction.customId;
                const selectedCategory = buttonInteraction.message.embeds[0].title.split(" ")[0].toLowerCase();

                if (customId === "categorySelect") {
                    const selectedCategory = buttonInteraction.values[0];
                    currentPage = 0;
                    await buttonInteraction.editReply({
                        embeds: [createCategoryEmbed(selectedCategory, currentPage)],
                        components: [
                            selectActionRow,
                            createPaginationButtons(selectedCategory, currentPage),
                        ],
                    });
                } else if (customId === "prevPage" || customId === "nextPage") {
                    currentPage = customId === "prevPage" ? currentPage - 1 : currentPage + 1;
                    await buttonInteraction.editReply({
                        embeds: [createCategoryEmbed(selectedCategory, currentPage)],
                        components: [
                            selectActionRow,
                            createPaginationButtons(selectedCategory, currentPage),
                        ],
                    });
                }
            });

            collector.on("end", async () => {
                const disabledRow = new ActionRowBuilder().addComponents(
                    createPaginationButtons("general", currentPage).components.map((button) =>
                        button.setDisabled(true)
                    )
                );

                await interaction.editReply({
                    components: [disabledRow],
                });
            });
        } catch (error) {
            console.error("Error in help command:", error);
            await interaction.editReply({
                content: "An error occurred while generating the help menu.",
            });
        }
    },

    name: "help",
    description: "Displays a help menu with available commands.",
};
