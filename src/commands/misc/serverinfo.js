const {
    Client,
    Interaction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
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

            const guild = interaction.guild;

            if (!guild) {
                return await interaction.editReply("This command can only be used in a server.");
            }

            const owner = await guild.fetchOwner();
            const bannerURL = guild.bannerURL({ dynamic: true, size: 256 });

            const embed = new EmbedBuilder()
                .setColor("Grey")
                .setTitle(`${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
                .addFields(
                    { name: "ID", value: `${guild.id}`, inline: true },
                    { name: "Owner", value: `<@${owner.user.id}>`, inline: true },
                    { name: "Created On", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                    { name: "Members", value: `${guild.memberCount}`, inline: true },
                    {
                        name: "Boost Count",
                        value: `${guild.premiumSubscriptionCount || 0} (Tier ${guild.premiumTier})`,
                        inline: true,
                    },
                    { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
                    { name: "Channels", value: `${guild.channels.cache.size}`, inline: true }
                )
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            if (bannerURL) {
                embed.setImage(bannerURL);
            }

            const viewRolesButton = new ButtonBuilder()
                .setCustomId("view_roles")
                .setLabel("View Roles")
                .setStyle(ButtonStyle.Success);

            const actionRow = new ActionRowBuilder().addComponents(viewRolesButton);

            await interaction.editReply({ embeds: [embed], components: [actionRow] });

            const filter = (btnInteraction) =>
                btnInteraction.customId === "view_roles" &&
                btnInteraction.user.id === interaction.user.id;

            const collector = interaction.channel.createMessageComponentCollector({
                filter,
            });

            collector.on("collect", async (btnInteraction) => {
                const roles = guild.roles.cache
                    .filter((role) => role.name !== "@everyone")
                    .sort((a, b) => b.position - a.position)
                    .map((role) => role.toString());

                const roleEmbed = new EmbedBuilder()
                    .setColor("#4ea554")
                    .setTitle("Server Roles")
                    .setDescription(roles.length ? roles.join("\n") : "No roles found.")
                    .setFooter({
                        text: `Requested by ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                    })
                    .setTimestamp();

                await btnInteraction.reply({
                    embeds: [roleEmbed],
                    ephemeral: true,
                });
            });
        } catch (error) {
            console.error("Error fetching server info:", error);
            await interaction.editReply({
                content: "An error occurred while trying to fetch the server information.",
            });
        }
    },

    name: "serverinfo",
    description: "Displays information about the current server.",
};
