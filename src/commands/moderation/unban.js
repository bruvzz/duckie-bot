const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const logChannelsPath = path.join(__dirname, "../logChannels.json");
const logsFilePath = path.join(__dirname, "../modlogs.json");

module.exports = {
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return await interaction.editReply("You don't have permission to unban members.");
            }

            const userId = interaction.options.getString("userid");

            if (!userId) {
                return await interaction.editReply("Please provide a valid user ID.");
            }

            const bannedUsers = await interaction.guild.bans.fetch();

            const userBanInfo = bannedUsers.get(userId);

            if (!userBanInfo) {
                return await interaction.editReply("This user is not banned.");
            }

            await interaction.guild.members.unban(userId);

            const user = await client.users.fetch(userId);

            const embed = new EmbedBuilder()
                .setColor("#4ea554")
                .setTitle("Success")
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .addFields(
                    {
                        name: "User Unbanned:",
                        value: `<@${user.id}> (${user.id})`,
                        inline: true,
                    },
                    {
                        name: "Moderator:",
                        value: `${interaction.user} (${interaction.user.id})`,
                        inline: true,
                    },
                );

            await interaction.editReply({ embeds: [embed] });

            let logChannels = {};
            if (fs.existsSync(logChannelsPath)) {
                logChannels = JSON.parse(fs.readFileSync(logChannelsPath, "utf-8"));
            }

            const logChannelId = logChannels[interaction.guild.id];
            if (logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder(embed.data)
                        .setTitle("Unban Log")
                        .setTimestamp()

                    await logChannel.send({ embeds: [logEmbed] });
                } else {
                    console.error("Log channel not found.");
                }
            }

            let modLogs = {};
            if (fs.existsSync(logsFilePath)) {
                const data = fs.readFileSync(logsFilePath);
                modLogs = JSON.parse(data);
            }
                          
            if (!modLogs[targetUser.id]) modLogs[targetUser.id] = [];
                          
                modLogs[targetUser.id].push({
                    type: "Unban",
                    reason: reason,
                    moderator: interaction.user.id,
                    timestamp: Math.floor(Date.now() / 1000),
                });
                          
            fs.writeFileSync(logsFilePath, JSON.stringify(modLogs, null, 2));
        } catch (error) {
            console.error(`Error unbanning user:, ${error}`);
            await interaction.editReply("An error occurred while trying to unban the user.");
        }
    },

    name: "unban",
    description: "Unban a member from the server.",
    options: [
        {
            name: "userid",
            description: "The ID of the user to unban.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
};
