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
      const username = interaction.options.getString("roblox-username");

      if (!username) {
        return await interaction.reply("Please provide a Roblox username.");
      }

      const res = await fetch(`https://users.roblox.com/v1/users/search?keyword=${username}`);
      const data = await res.json();

      if (!data.data || data.data.length === 0) {
        return await interaction.reply("No user found with that username.");
      }

      const user = data.data[0];
      const userId = user.id;
      const avatarUrl = `https://www.roblox.com/bust-thumbnail/image?userId=${userId}&width=420&height=420&format=png`;

      const userDetails = await fetch(`https://users.roblox.com/v1/users/${userId}`);
      const userDetailsData = await userDetails.json();

      if (!userDetailsData) {
        return await interaction.reply("An error occurred while fetching additional user details.");
      }

      const friendsDetails = await fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`);
      const friendsDetailsData = await friendsDetails.json();

      const isBanned = userDetailsData.isBanned ? "✅" : "❌";
      const isVerified = userDetailsData.hasVerifiedBadge ? "✅" : "❌";

      const embed = new EmbedBuilder()
        .setColor("#4ea554")
        .setTitle(`${user.name}'s Roblox Profile`)
        .setDescription(`Here is the data for the Roblox user: **${user.name}**`)
        .setThumbnail(avatarUrl)
        .addFields(
        { 
            name: "Username", 
            value: user.name, 
            inline: false, 
        },
        { 
            name: "User ID", 
            value: userId.toString(), 
            inline: false, 
        },
        {
            name: "Display Name",
            value: userDetailsData.displayName || "N/A",
            inline: false,
        },
        { 
            name: "Avatar", 
            value: `[Avatar Link](https://www.roblox.com/users/${userId}/profile)`, 
            inline: false, 
        },
        {
            name: "Join Date",
            value: userDetailsData.created ? new Date(userDetailsData.created).toLocaleDateString() : "No data available",
            inline: false,
        },
        {
            name: "Description",
            value: userDetailsData.description || "N/A",
            inline: false,
        },
        {
            name: "Friends",
            value: friendsDetailsData.count !== undefined ? friendsDetailsData.count.toString() : "N/A",
            inline: false,
        },
        {
            name: "Verified",
            value: isVerified,
            inline: false,
        },
        {
            name: "Banned",
            value: isBanned,
            inline: false,
        }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching Roblox user data:", error);
      await interaction.reply("An error occurred while fetching the Roblox user data.");
    }
  },

  name: "roblox-username",
  description: "Get detailed information about a Roblox user by their username.",
  options: [
    {
      name: "roblox-username",
      description: "The Roblox username to fetch data for.",
      type: 3,
      required: true,
    },
  ],
};
