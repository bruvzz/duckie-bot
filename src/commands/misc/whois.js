const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    EmbedBuilder,
} = require("discord.js");

module.exports = {
    /**
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const targetUser = interaction.options.getUser("user") || interaction.user;
            const targetMember = interaction.guild.members.cache.get(targetUser.id);

            const coloredRole = targetMember?.roles.cache
                .filter((r) => r.color !== 0)
                .sort((a, b) => b.position - a.position)
                .first();

            const embedColor = coloredRole?.color || "Grey";

            const roles = targetMember?.roles.cache
                .filter((role) => role.name !== "@everyone")
                .sort((a, b) => b.position - a.position)
                .map((role) => `${role}`)
                .join(", ") || "No roles";

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({
                    name: `${targetUser.tag}`,
                    iconURL: targetUser.displayAvatarURL({ dynamic: true }),
                })
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
                .addFields(
                    { name: "Username", value: `<@${targetUser.id}>`, inline: false },
                    { name: "User ID", value: `${targetUser.id}`, inline: false },
                    {
                        name: "Account Created",
                        value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`,
                        inline: true,
                    },
                    {
                        name: "Server Joined",
                        value: targetMember
                            ? `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:F>`
                            : "Not a member",
                        inline: true,
                    },
                    { name: "Roles", value: `${roles}`, inline: false }
                )
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Error fetching user info:", error);
            await interaction.editReply("An error occurred while fetching the user's information.");
        }
    },

    name: "whois",
    description: "Get information about a user.",
    options: [
        {
            name: "user",
            description: "The user to get information about.",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
};
