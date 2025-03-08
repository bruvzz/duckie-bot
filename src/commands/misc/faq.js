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
        .setColor("#4ea554")
        .setAuthor({
            name: "Official Submarine Bot",
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTitle("Greetings,")
        .setDescription(
            `<@${interaction.user.id}>\n\n__*Frequently Asked Questions*__:\n> All questions and/or inquiries can be handled and assisted by our <@&1335724055755493486> team. If one cannot assist you, please seek someone else or a higher position for help.\n\n__*Common Fixes*__:\n> Temporarily, you can find any fixes listed [here](https://docs.google.com/document/d/1200GhxUFHryDlU-WB4SK1FAqx06PPxgTzz-iDrPU8q8/edit?tab=t.0#heading=h.1fob9te). In the meantime, we are currently working on getting our support system back online and restore its functionality.`
        )
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error handling faq command:", error);
      await interaction.editReply({
        content: "An error occurred while generating the information.",
      });
    }
  },

  name: "faq",
  description: "Get frequently asked questions and answers on Submarine Services.",
};
