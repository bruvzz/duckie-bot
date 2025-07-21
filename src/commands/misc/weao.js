const {
  Client,
  Interaction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      await interaction.deferReply();

      const fetchExploitStatus = async (url) => {
        const response = await fetch(url);
        const data = await response.json();
        data.updateStatus = data.updateStatus ? `[\`🟩\`]` : `[\`🟥\`]`;
        return data;
      };

      const robloxResponse = await fetch("https://weao.xyz/api/versions/current");
      const robloxObj = await robloxResponse.json();

      const androidResponse = await fetch("https://weao.xyz/api/versions/android");
      const androidObj = await androidResponse.json();

      const exploits = [
        { name: "Zenith", url: "https://weao.xyz/api/status/exploits/zenith" },
        { name: "Wave", url: "https://weao.xyz/api/status/exploits/wave" },
        { name: "AWP.GG", url: "https://weao.xyz/api/status/exploits/awp.gg" },
        { name: "Volcano", url: "https://weao.xyz/api/status/exploits/volcano" },
        { name: "Velocity", url: "https://weao.xyz/api/status/exploits/velocity" },
        { name: "Swift", url: "https://weao.xyz/api/status/exploits/swift" },
        { name: "Seliware", url: "https://weao.xyz/api/status/exploits/seliware" },
        { name: "Valex", url: "https://weao.xyz/api/status/exploits/valex" },
        { name: "Potassium", url: "https://weao.xyz/api/status/exploits/potassium" },
        { name: "Solara", url: "https://weao.xyz/api/status/exploits/solara" },
        { name: "Xeno", url: "https://weao.xyz/api/status/exploits/xeno" },
        { name: "Bunni.lol", url: "https://weao.xyz/api/status/exploits/bunni.lol" },
        { name: "Sirhurt", url: "https://weao.xyz/api/status/exploits/sirhurt" },
      ];

      const exploitData = await Promise.all(
        exploits.map(async (exploit) => ({
          name: exploit.name,
          ...await fetchExploitStatus(exploit.url),
        }))
      );

      const exploitDescriptions = exploitData.map(
        (exploit) =>
          `${exploit.updateStatus} **${exploit.name}** | [\`${exploit.version}\`] | [\`${exploit.updatedDate}\`]`
      ).join("\n");

      const embed = new EmbedBuilder()
        .setTitle("[Current Statuses]")
        .setDescription(
          `**Windows Hash**: __${robloxObj.Windows}__ | [\`${robloxObj.WindowsDate}\`]\n` +
          `**Mac Hash**: __${robloxObj.Mac}__ | [\`${robloxObj.MacDate}\`]\n` +
          `**Android Version**: __${androidObj.Android}__ | [\`${androidObj.AndroidDate}\`]\n\n` +
          exploitDescriptions
        )
        .setColor("Grey")
        .setTimestamp();

      const versionButton = new ButtonBuilder()
        .setLabel(`${robloxObj.Windows}`)
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("windows_version_display")
        .setDisabled(true);

      const downloadButton = new ButtonBuilder()
        .setLabel("Download")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://rdd.weao.xyz/?channel=LIVE&binaryType=WindowsPlayer&version=${robloxObj.Windows}`);

      const row = new ActionRowBuilder().addComponents(versionButton, downloadButton);

      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error("Error fetching data:", error);
      await interaction.editReply("An error occurred while fetching the data.");
    }
  },

  name: "weao",
  description: "Get the list of Roblox Windows Exploits.",
};
