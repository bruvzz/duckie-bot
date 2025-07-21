const { 
  Client, 
  Interaction, 
  EmbedBuilder, 
  PermissionFlagsBits, 
} = require("discord.js");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const allowedRole = "1367961650010914928";

    if (!interaction.member.roles.cache.has(allowedRole)) {
      return await interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
    }
    
    try {
        const generatedKey = uuidv4();

        const embed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("🔑 Key Generated")
        .setDescription(`Here's your generated key: \`${generatedKey}\``)
        .setTimestamp()
        .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error("Error generating key:", error);
        await interaction.reply({ content: "❌ Failed to generate a key.", ephemeral: true });
    }
  },

  name: "generatekey",
  description: "Generates a key.",
};
