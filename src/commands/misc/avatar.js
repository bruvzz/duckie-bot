const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    EmbedBuilder,
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

            const targetUser = interaction.options.getUser("user") || interaction.user;

            const avatarUrl = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });

            const embed = new EmbedBuilder()
                .setColor("Grey")
                .setTitle(`${targetUser.username}'s Avatar`)
                .setImage(avatarUrl)
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Error fetching avatar:", error);
            await interaction.editReply("An error occurred while trying to fetch the avatar.");
        }
    },

    name: "avatar",
    description: "Get the avatar of a user.",
    options: [
        {
            name: "user",
            description: "The user whose avatar you want to see.",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
};
