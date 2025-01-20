const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const logChannelsPath = path.join(__dirname, "../logChannels.json");

module.exports = {
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return await interaction.reply({
                    content: "You don't have permission to manage messages.",
                    ephemeral: true,
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const amount = interaction.options.getInteger("amount");

            if (amount < 1 || amount > 100) {
                return await interaction.editReply({
                    content: "Please provide a number between 1 and 100.",
                });
            }

            const fetchedMessages = await interaction.channel.messages.fetch({
                limit: amount,
            });

            const deletedMessages = await interaction.channel.bulkDelete(fetchedMessages, true);

            const messageWord = deletedMessages.size === 1 ? "message" : "messages";

            const embed = new EmbedBuilder()
                .setColor("#4ea554")
                .setTitle("Success")
                .setDescription(
                    `Successfully deleted **${deletedMessages.size} ${messageWord}.**`
                )
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            let logChannels = {};
            if (fs.existsSync(logChannelsPath)) {
                logChannels = JSON.parse(fs.readFileSync(logChannelsPath, "utf-8"));
            }

            const logChannelId = logChannels[interaction.guild.id];
            if (logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor("#4ea554")
                        .setTitle("Purge Log")
                        .setDescription(
                            `<@${interaction.user.id}> (**${interaction.user.id}**) purged **${deletedMessages.size} ${messageWord}** in <#${interaction.channel.id}>.`
                        )
                        .setFooter({
                            text: `Action performed by ${interaction.user.tag}`,
                            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                        })
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                } else {
                    console.error("Log channel not found.");
                }
            }
        } catch (error) {
            console.error("Error deleting messages:", error);
            await interaction.editReply({
                content: "An error occurred while trying to delete messages.",
            });
        }
    },

    name: "purge",
    description: "Delete a specified number of messages from the channel.",
    options: [
        {
            name: "amount",
            description: "The number of messages to delete (1-100).",
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
    ],
};
