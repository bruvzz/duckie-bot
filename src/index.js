require("dotenv").config();
const { Client, IntentsBitField, EmbedBuilder } = require("discord.js");
const cron = require("node-cron");
const eventHandler = require("./handlers/eventHandler");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const CHANNEL_ID = "";
let currentWindowsHash = null;
let futureWindowsHash = null;

const fetchWindowsHash = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.Windows;
  } catch (error) {
    console.error(`Error fetching Roblox Windows hash from ${url}:`, error);
    return null;
  }
};

const monitorHashUpdates = async () => {
  const newCurrentHash = await fetchWindowsHash("https://weao.xyz/api/versions/current");
  const newFutureHash = await fetchWindowsHash("https://weao.xyz/api/versions/future");

  const channel = client.channels.cache.get(CHANNEL_ID);

  if (channel) {
    const messagesToSend = [];

    if (newCurrentHash && newCurrentHash !== currentWindowsHash) {
      currentWindowsHash = newCurrentHash;

      const currentEmbed = new EmbedBuilder()
        .setTitle("New Roblox Deployment Detected")
        .setColor("#4ea554")
        .setDescription(
          `All exploits are now patched. Roblox has updated to the following version:\n\n**Hash:** \`${newCurrentHash}\``
        )
        .setTimestamp();

      messagesToSend.push(currentEmbed);
    }

    if (newFutureHash && newFutureHash !== futureWindowsHash) {
      futureWindowsHash = newFutureHash;

      const futureEmbed = new EmbedBuilder()
        .setTitle("New Roblox Deployment Detected")
        .setColor("#4ea554")
        .setDescription(
          `**This is a future build and is not out yet.**\nA new version deployment has been released:\n\n**Hash:** \`${newFutureHash}\``
        )
        .setTimestamp();

      messagesToSend.push(futureEmbed);
    }

    if (messagesToSend.length > 0) {
      await channel.send({
        content: "@everyone",
        embeds: messagesToSend,
      });
    }
  }
};

setInterval(() => {
  console.log("Checking for Roblox Windows hash updates...");
  monitorHashUpdates();
}, 3000); // 3000 milliseconds = 3 seconds

client.on("ready", async () => {
  currentWindowsHash = await fetchWindowsHash("https://weao.xyz/api/versions/current");
  futureWindowsHash = await fetchWindowsHash("https://weao.xyz/api/versions/future");

  console.log(`Initial Roblox Windows Current Hash: ${currentWindowsHash}`);
  console.log(`Initial Roblox Windows Future Hash: ${futureWindowsHash}`);
});

eventHandler(client);
client.login(process.env.TOKEN);
