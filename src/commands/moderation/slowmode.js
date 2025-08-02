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
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return await interaction.editReply("You do not have permission to manage channels.");
            }

            const duration = interaction.options.getInteger("duration");
            const channel = interaction.options.getChannel("channel") || interaction.channel;

            if (duration < 0 || duration > 21600) {
                return await interaction.editReply("Please provide a valid duration between 0 and 21600 seconds (6 hours).");
            }

            await channel.setRateLimitPerUser(duration);

            const durationText = duration === 1 ? "second" : "seconds";

            const embed = new EmbedBuilder()
                .setColor("Grey")
                .setTitle("Success")
                .setDescription(
                    duration === 0
                        ? `Slowmode has been disabled in ${channel}.`
                        : `Slowmode in ${channel} has been set to **${duration} ${durationText}**.`
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
                        .setTitle("Slowmode Change Log")
                        .setDescription(
                            `**Channel:** <#${channel.id}>\n` +
                            `**Action:** Slowmode set to **${duration} ${durationText}**\n` +
                            `**Moderator:** <@${interaction.user.id}> (${interaction.user.id})`
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                } else {
                    console.error("Log channel not found.");
                }
            }
        } catch (error) {
            console.error("Error setting slowmode:", error);
            await interaction.editReply("An error occurred while setting the slowmode.");
        }
    },

    name: "slowmode",
    description: "Set a slowmode for a channel.",
    options: [
        {
            name: "duration",
            description: "The duration of the slowmode in seconds (0 to 21600).",
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
        {
            name: "channel",
            description: "The channel to apply the slowmode to. Defaults to the current channel.",
            type: ApplicationCommandOptionType.Channel,
            required: false,
        },
    ],
};
