const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const userChoice = interaction.options.getString("choice");

            if (!["rock", "paper", "scissors"].includes(userChoice)) {
                return await interaction.editReply({
                    content: "Please choose one of the following: rock, paper, or scissors.",
                    ephemeral: true,
                });
            }

            const botChoices = ["rock", "paper", "scissors"];
            const botChoice = botChoices[Math.floor(Math.random() * botChoices.length)];

            let result;
            if (userChoice === botChoice) {
                result = "It's a tie!";
            } else if (
                (userChoice === "rock" && botChoice === "scissors") ||
                (userChoice === "paper" && botChoice === "rock") ||
                (userChoice === "scissors" && botChoice === "paper")
            ) {
                result = "You win!";
            } else {
                result = "You lose!";
            }

            const embed = new EmbedBuilder()
                .setColor("Grey")
                .setTitle("Rock Paper Scissors")
                .setDescription(`
                    **Your choice**: ${userChoice.charAt(0).toUpperCase() + userChoice.slice(1)}
                    **Bot's choice**: ${botChoice.charAt(0).toUpperCase() + botChoice.slice(1)}
                    **Result**: ${result}
                `)
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Error in 'rock paper scissors' command:", error);
            await interaction.editReply({
                content: "An error occurred while trying to play Rock Paper Scissors.",
                ephemeral: true,
            });
        }
    },

    name: "rps",
    description: "Play Rock, Paper, Scissors with the bot.",
    options: [
        {
            name: "choice",
            description: "Your choice: rock, paper, or scissors.",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Rock", value: "rock" },
                { name: "Paper", value: "paper" },
                { name: "Scissors", value: "scissors" },
            ],
        },
    ],
};
