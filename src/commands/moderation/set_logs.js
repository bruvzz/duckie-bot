const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    ChannelType,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const logChannelsPath = path.join(__dirname, "../logChannels.json");

module.exports = {
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

            const channel = interaction.options.getChannel("channel");

            if (!channel || channel.type !== ChannelType.GuildText) {
                return interaction.reply({
                    content: "Please provide a valid text channel.",
                    ephemeral: true,
                });
            }

            let logChannels = {};
            if (fs.existsSync(logChannelsPath)) {
                logChannels = JSON.parse(fs.readFileSync(logChannelsPath, "utf-8"));
            }

            logChannels[interaction.guild.id] = channel.id;

            fs.writeFileSync(logChannelsPath, JSON.stringify(logChannels, null, 2));

            await interaction.reply({
                content: `Success. All successful moderation commands will now be logged in ${channel}.`,
                ephemeral: true,
            });
        } catch (error) {
            console.error("Error setting log channel:", error);
            await interaction.reply({
                content: "An error occurred while setting the log channel.",
                ephemeral: true,
            });
        }
    },

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
};
