const {
  Client,
  Interaction,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");

const reviewChannelId = "";
const allowedRole = ""; 
const ticketCategoryName = "request moderation";

module.exports = {
  name: "request-moderation",
  description: "Request moderation permissions for a specific role.",
  options: [
    {
      name: "role",
      description: "The role you are requesting for moderation.",
      type: 8,
      required: true,
    },
    {
      name: "user-to-moderate",
      description: "The user ID of the member who needs moderation.",
      type: 3,
      required: true,
    },
    {
      name: "reason",
      description: "The reason you are requesting moderation.",
      type: 3,
      required: true,
    },
    {
      name: "images",
      description: "Any image links or attachments supporting your reason.",
      type: 3,
      required: false,
    },
  ],

  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      if (!interaction.member.roles.cache.has(allowedRole)) {
        return await interaction.editReply({
          content: "❌ You don't have permission to use this command.",
        });
      }

      const requestedRole = interaction.options.getRole("role");
      const targetUserId = interaction.options.getString("user-to-moderate");
      const reason = interaction.options.getString("reason");
      const images = interaction.options.getString("images");
      const user = interaction.user;

      let category = interaction.guild.channels.cache.find(
        (c) => c.name === ticketCategoryName && c.type === ChannelType.GuildCategory
      );

      if (!category) {
        category = await interaction.guild.channels.create({
          name: ticketCategoryName,
          type: ChannelType.GuildCategory,
        });
      }

      const channelName = `mod-${user.username}-${requestedRole.name}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory],
          },
          {
            id: requestedRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory],
          },
          {
            id: allowedRole,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory],
          },
        ],
      });

      const ticketEmbed = new EmbedBuilder()
        .setColor("Grey")
        .setTitle("🛡️ Moderation Request Ticket")
        .setDescription(`Welcome <@${user.id}>. This channel has been created for your moderation request regarding <@${requestedRole.id}>. Please provide any further proof or clarification here.`)
        .addFields(
          { name: "Requested By", value: `<@${user.id}> (\`${user.id}\`)`, inline: true },
          { name: "Role Requested", value: `<@&${requestedRole.id}>`, inline: true },
          { name: "User to Moderate", value: `\`${targetUserId}\``, inline: true },
          { name: "Reason", value: `\`${reason}\`` }
        )
        .setTimestamp();

      if (images) {
        ticketEmbed.addFields({ name: "Initial Evidence", value: images });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Close")
          .setStyle(ButtonStyle.Secondary)
      );

      const initialMessage = await ticketChannel.send({
        content: `<@${user.id}> | <@&${requestedRole.id}>`,
        embeds: [ticketEmbed],
        components: [row],
      });

      const logChannel = await client.channels.fetch(reviewChannelId);
      if (logChannel && logChannel.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setColor("Grey")
          .setTitle("🎫 Ticket Created")
          .addFields(
            { name: "User", value: `<@${user.id}>`, inline: true },
            { name: "Channel", value: `<#${ticketChannel.id}>`, inline: true }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
      }

      await interaction.editReply({
        content: `✅ Your moderation request ticket has been created: <#${ticketChannel.id}>`,
      });

      const collector = initialMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 0,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "close_ticket") {
          if (!i.member.roles.cache.has(allowedRole) && i.user.id !== user.id) {
            return i.reply({ content: "❌ Only staff or the requester can close this ticket.", ephemeral: true });
          }

          await i.update({
            content: `Closing ticket. Channel will be deleted in 5 seconds.`,
            components: [],
          });

          if (i.user.id !== user.id) {
            try {
              const closeEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("🛡️ Moderation Request Closed")
                .setDescription(`Your moderation request regarding **${requestedRole.name}** has been closed by **${i.user.tag}**.`)
                .setTimestamp();
              
              await user.send({ embeds: [closeEmbed] }).catch(() => {
                console.log(`Could not DM user ${user.id} about ticket closure.`);
              });
            } catch (dmError) {
              console.error("DM Error:", dmError);
            }
          }

          setTimeout(async () => {
            try {
              if (ticketChannel) await ticketChannel.delete();
            } catch (delError) {
              console.error("Error deleting channel:", delError);
            }
          }, 5000);
        }
      });

    } catch (error) {
      console.error("Error submitting moderation request:", error);
      if (interaction.deferred) {
        await interaction.editReply({
          content: "❌ Something went wrong while creating your ticket.",
        });
      } else {
        await interaction.reply({
          content: "❌ Something went wrong while creating your ticket.",
          ephemeral: true,
        });
      }
    }
  },
};
