const { 
    Client, 
    Interaction, 
    EmbedBuilder, 
    ApplicationCommandOptionType, 
    PermissionsBitField, 
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const logChannelsPath = path.join(__dirname, "../logChannels.json");
const logsFilePath = path.join(__dirname, "../modlogs.json");

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

            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (!member || !member.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
                return interaction.reply({
                    content: "You do not have permission to manage nicknames.",
                    ephemeral: true,
                });
            }

            const userId = interaction.options.getString("userid");
            const reason = interaction.options.getString("reason") || "N/A";

            const user = await client.users.fetch(userId).catch(() => null);
            const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);

            if (!user || !targetMember) {
                return interaction.reply({
                    content: "Could not find a member with the provided User ID.",
                    ephemeral: true,
                });
            }

            const botMember = interaction.guild.members.cache.get(client.user.id);
            if (!botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
                return interaction.reply({
                    content: "I do not have permission to manage nicknames.",
                    ephemeral: true,
                });
            }

            const randomString = Math.random().toString(36).substring(2, 8);
            const moderatedNickname = `Moderated #${randomString}`;

            await targetMember.setNickname(moderatedNickname, reason);

            const embed = new EmbedBuilder()
                .setTitle("Success")
                .setColor("Grey")
                .setDescription(
                    `Successfully moderated the username of **${user.tag}**.\n\n**New Nickname:** \`${moderatedNickname}\`\n**Reason:** ${reason}`
                )
                .setTimestamp()
                .setFooter({
                    text: `Action performed by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });

            await interaction.reply({ embeds: [embed] });

            let logChannels = {};
            if (fs.existsSync(logChannelsPath)) {
                logChannels = JSON.parse(fs.readFileSync(logChannelsPath, "utf-8"));
            }

            const logChannelId = logChannels[interaction.guild.id];
            if (logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder(embed.data)
                        .setTitle("Nickname Change Log")
                        .setTimestamp();

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
                    type: "Moderated-Nickname",
                    reason: reason,
                    moderator: interaction.user.id,
                    timestamp: Math.floor(Date.now() / 1000),
                });
                          
            fs.writeFileSync(logsFilePath, JSON.stringify(modLogs, null, 2));
        } catch (error) {
            console.error("Error moderating nickname:", error);
            await interaction.reply({
                content: "An error occurred while moderating the nickname.",
                ephemeral: true,
            });
        }
    },

    name: "moderate-nickname",
    description: "Moderates a person's username using their User ID.",
    options: [
        {
            name: "userid",
            description: "The User ID of the person whose username you want to moderate.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "reason",
            description: "The reason for moderating the username.",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
};
