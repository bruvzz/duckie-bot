require("dotenv").config();
const {
  Client,
  IntentsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const cron = require("node-cron");
const eventHandler = require("./handlers/eventHandler");

const CHANNEL_ID = process.env.NOTIFY_CHANNEL_ID || "";
const EVERYONE_PING = "@everyone";
const MIN_BET_INTERVAL_MS = 3000;

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

let currentWindowsHash = null;
let futureWindowsHash = null;

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    return null;
  }
}

function buildEmbed(title, color, description) {
  return new EmbedBuilder().setTitle(title).setColor(color).setDescription(description).setTimestamp();
}

function buildVersionButton(hash) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel(hash)
      .setStyle(ButtonStyle.Link)
      .setURL(`https://rdd.weao.xyz/?channel=LIVE&binaryType=WindowsPlayer&version=${hash}`)
  );
}

function buildFutureRow(futureHash) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel(futureHash).setStyle(ButtonStyle.Secondary).setDisabled(false),
    new ButtonBuilder()
      .setLabel("Download")
      .setStyle(ButtonStyle.Link)
      .setURL(
        `https://rdd.weao.xyz/?channel=LIVE&binaryType=WindowsPlayer&version=${futureHash}`
      )
  );
}

async function notifyCurrent(channel, newCurrentHash) {
  currentWindowsHash = newCurrentHash;

  const currentEmbed = new EmbedBuilder()
    .setTitle("New Roblox Deployment Detected")
    .setColor("#962424")
    .setDescription("All exploits are now patched. Roblox has updated to a new version.")
    .setTimestamp();

  const row = buildVersionButton(newCurrentHash);

  await channel.send({
    content: EVERYONE_PING,
    embeds: [currentEmbed],
    components: [row],
  });
}

async function notifyFuture(channel, newFutureHash) {
  futureWindowsHash = newFutureHash;

  const futureEmbed = new EmbedBuilder()
    .setTitle("New Roblox Deployment Detected")
    .setColor("#965d24")
    .setDescription("**This is a future build and is not out yet.** A new version deployment has been released.")
    .setTimestamp();

  const row = buildFutureRow(newFutureHash);

  await channel.send({
    content: EVERYONE_PING,
    embeds: [futureEmbed],
    components: [row],
  });
}

async function monitorHashUpdates() {
  try {
    const [currentData, futureData] = await Promise.all([
      fetchJson("https://weao.xyz/api/versions/current"),
      fetchJson("https://weao.xyz/api/versions/future"),
    ]);

    const newCurrentHash = currentData?.Windows || null;
    const newFutureHash = futureData?.Windows || null;

    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
      console.warn(`Channel with ID ${CHANNEL_ID} not found.`);
      return;
    }

    if (newCurrentHash && newCurrentHash !== currentWindowsHash) {
      await notifyCurrent(channel, newCurrentHash);
    }

    if (newFutureHash && newFutureHash !== futureWindowsHash) {
      await notifyFuture(channel, newFutureHash);
    }
  } catch (err) {
    console.error("monitorHashUpdates error:", err);
  }
}

client.once("ready", async () => {
  try {
    currentWindowsHash = (await fetchJson("https://weao.xyz/api/versions/current"))?.Windows || null;
    futureWindowsHash = (await fetchJson("https://weao.xyz/api/versions/future"))?.Windows || null;

    console.log(`Initial Roblox Windows Current Hash: ${currentWindowsHash}`);
    console.log(`Initial Roblox Windows Future Hash: ${futureWindowsHash}`);

    client.user.setPresence({
      activities: [{ name: "with Submarine! /help", type: 0 }],
      status: "idle",
    });

    // kick off cron checking every 3 seconds
    cron.schedule("*/3 * * * * *", () => {
      console.log("Checking for Roblox Windows hash updates..."); // keep for visibility
      monitorHashUpdates();
    });
  } catch (err) {
    console.error("Error during ready handler:", err);
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const isOnlyMentioningBot =
    message.mentions.has(client.user) && message.mentions.users.size === 1;

  if (isOnlyMentioningBot) {
    const reply = await message.reply(
      `${message.author} - Greetings! Use \`/help\` if you need any assistance.`
    );
    setTimeout(async () => {
      try {
        await reply.delete();
      } catch (err) {
        console.error("Failed to delete bot reply:", err);
      }
    }, 5000);
  }

  if (message.content.toLowerCase() === "w.help") {
    await message.reply(`${message.author} - There will never be prefixes, fuckass boy.`);
  }
});

// centralized process-level error logging
const isIgnoredError = (obj) =>
  JSON.stringify(obj).match(/(Error: read ECONNRESET|-4077|stream_base_commons:217:20)/g);

process.on("unhandledRejection", (reason, p) => {
  if (isIgnoredError(reason)) {
    return console.log("WSS Error: Client Lost Connection and Connection Reset");
  }
  console.log("\n=== UNHANDLED REJECTION ===");
  console.log("Promise:", p, "Reason:", reason.stack || reason);
  console.log("=== UNHANDLED REJECTION ===");
});

process.on("uncaughtException", (err, origin) => {
  if (isIgnoredError(err)) return;
  console.log("\n=== UNCAUGHT EXCEPTION ===");
  console.log("Origin:", origin, "Exception:", err.stack || err);
  console.log("=== UNCAUGHT EXCEPTION ===");
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  if (isIgnoredError(err)) return;
  console.log("\n=== UNCAUGHT EXCEPTION MONITOR ===");
  console.log("Origin:", origin, "Exception:", err.stack || err);
  console.log("=== UNCAUGHT EXCEPTION MONITOR ===");
});

process.on("beforeExit", (code) => {
  console.log("\n=== BEFORE EXIT ===");
  console.log("Code:", code);
});

process.on("exit", (code) => {
  console.log("\n=== EXIT ===");
  console.log("Code:", code);
});

process.on("multipleResolves", (type, promise, reason) => {
  console.log("\n=== MULTIPLE RESOLVES ===");
  console.log(type, promise, reason);
});

eventHandler(client);
client.login(process.env.TOKEN);
