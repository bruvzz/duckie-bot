const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const logChannelsPath = path.join(__dirname, "../logChannels.json");

module.exports = {
    name: "set-logs",
    description: "Set the channel where moderation logs will be sent.",
    options: [
        {
            name: "channel",
            description: "The channel where moderation logs will be sent.",
            type: ApplicationCommandOptionType.Channel,
            required: true,
        },
    ],
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            if (!interaction.guild) {
                return interaction.reply({
                    content: "This command can only be used in a server.",
                    ephemeral: true,
                });
            }

            if (!interaction.member.permissions.has("ManageChannels")) {
                return interaction.reply({
                    content: "You do not have permission to set log channels.",
                    ephemeral: true,
                });
            }

            const newChannel = interaction.options.getChannel("channel");
            if (!newChannel || newChannel.type !== ChannelType.GuildText) {
                return interaction.reply({
                    content: "Please provide a valid text channel.",
                    ephemeral: true,
                });
            }

            let logChannels = {};
            if (fs.existsSync(logChannelsPath)) {
                logChannels = JSON.parse(fs.readFileSync(logChannelsPath, "utf-8"));
            }

            const currentChannelId = logChannels[interaction.guild.id];

            if (currentChannelId === newChannel.id) {
                return interaction.reply({
                    content: `${newChannel} is already set as the logs channel.`,
                    ephemeral: true,
                });
            }

            if (currentChannelId && currentChannelId !== newChannel.id) {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`overwrite_logs_${newChannel.id}`)
                        .setLabel("Overwrite")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId("cancel_logs")
                        .setLabel("Cancel")
                        .setStyle(ButtonStyle.Danger)
                );

                return interaction.reply({
                    content: `<#${currentChannelId}> is currently the logs channel. Are you sure you want to log everything in ${newChannel}?`,
                    ephemeral: true,
                    components: [row],
                });
            }

            logChannels[interaction.guild.id] = newChannel.id;
            fs.writeFileSync(logChannelsPath, JSON.stringify(logChannels, null, 2));

            return interaction.reply({
                content: `Success! All moderation logs will now be sent to ${newChannel}.`,
                ephemeral: true,
            });
        } catch (error) {
            console.error("Error setting log channel:", error);
            return interaction.reply({
                content: "An error occurred while setting the log channel.",
                ephemeral: true,
            });
        }
    },
};
