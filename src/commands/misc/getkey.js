const { 
    Client, 
    Interaction, 
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
      await interaction.deferReply({ephemeral: true});

      const guild = interaction.guild;

      const embed = new EmbedBuilder()
        .setColor("Grey")
        .setAuthor({
            name: "Official Submarine Bot",
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTitle("Greetings,")
        .setDescription(
            `<@${interaction.user.id}>\n\n__*Download*__: ➤ [Here](https://getwave.gg)\n__*Key*__: ➤ [Here](https://key.getwave.gg)\n__*Resellers*__: ➤ [Here](https://getwave.gg/resellers)\n__*Documentation*__: ➤ [Here](https://duckys-playground.gitbook.io/wave/getting-started)`
        )
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error handling getkey command:", error);
      await interaction.editReply({
        content: "An error occurred while generating the information.",
      });
    }
  },

  name: "getkey",
  description: "Get special information on Submarine Services.",
};
