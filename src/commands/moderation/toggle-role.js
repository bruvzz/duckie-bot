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
            if (!member || !member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                return interaction.reply({
                    content: "You do not have permission to manage roles.",
                    ephemeral: true,
                });
            }

            const userId = interaction.options.getString("userid");
            const role = interaction.options.getRole("role");

            const user = await client.users.fetch(userId).catch(() => null);
            const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);

            if (!user || !targetMember) {
                return interaction.reply({
                    content: "Could not find a member with the provided User ID.",
                    ephemeral: true,
                });
            }

            const botMember = interaction.guild.members.cache.get(client.user.id);
            if (role.position >= botMember.roles.highest.position) {
                return interaction.reply({
                    content: "I cannot manage a role that is higher than or equal to my highest role.",
                    ephemeral: true,
                });
            }

            if (role.position >= member.roles.highest.position && member.id !== interaction.guild.ownerId) {
                return interaction.reply({
                    content: "You cannot manage a role that is higher than or equal to your highest role.",
                    ephemeral: true,
                });
            }

            let action;
            if (targetMember.roles.cache.has(role.id)) {
                await targetMember.roles.remove(role);
                action = "removed";
            } else {
                await targetMember.roles.add(role);
                action = "assigned";
            }

            const embed = new EmbedBuilder()
                .setTitle("Success")
                .setColor("Grey")
                .setDescription(
                    `Successfully **${action}** the role ${role} for **${user.tag}**.`
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
                    const logEmbed = new EmbedBuilder()
                        .setColor("Grey")
                        .setTitle("Role Change Log")
                        .setDescription(
                            `**User:** <@${user.id}> (${user.id})\n` +
                            `**Action:** Role ${action}\n` +
                            `**Role:** <@&${role.id}> (${role.name})\n` +
                            `**Moderator:** <@${interaction.user.id}> (${interaction.user.id})`
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                } else {
                    console.error("Log channel not found.");
                }
            }
        } catch (error) {
            console.error("Error managing role:", error);
            await interaction.reply({
                content: "An error occurred while managing the role.",
                ephemeral: true,
            });
        }
    },

    name: "toggle-role",
    description: "Toggle a server role for a user by their User ID.",
    options: [
        {
            name: "userid",
            description: "The User ID of the person you want to manage the role for.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "role",
            description: "The role to toggle.",
            type: ApplicationCommandOptionType.Role,
            required: true,
        },
    ],
};
