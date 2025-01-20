Old Discord Bot that I may or may not update later.

# Changelog:
*Updated as of:* `January 20, 2024 // 12:20 AM [EDT]`
- **src/**
   - Updated [index.js](https://github.com/bruvzz/duckie-bot/commit/db66d353e1c736005a1d5cd0d6e287135c984651)

- **src/commands/**
  - Created [logChannels.json](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/logChannels.json)
    > ^ This is important if you want to be able to log moderation commands!

- **src/commands/fun/**
   - Created [roblox-username.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/fun/roblox-username.js)

- **src/commands/misc/**
   - Created [github.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/misc/github.js)
   - Updated [help.js](https://github.com/bruvzz/duckie-bot/commits/main/src/commands/misc/help.js?since=2025-01-19&until=2025-01-20)

- **src/commands/moderation**
   - Updated all of moderation commands
   - Created [set-logs.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/moderation/set_logs.js)

> [!IMPORTANT]
This bot uses discord.js 14.11.0

# Package Installations:

## discord.js 14.11.0
```node.js
npm i discord.js@14.11.0
```

## dotenv 16.1.4
```node.js
npm i dotenv@16.1.4
```

## ms 2.1.3
```node.js
npm i ms@2.1.3
```

## pretty.ms 8.0.0
```node.js
npm i pretty.ms@8.0.0
```

## node-fetch 3.3.2
```node.js
npm i node-fetch@3.3.2
```
- this is optional. only download this package if your node.js is version 18 or below.

# Running The Bot:
- simply run the bot by doing the following:
```node.js
node .
```
or you can also do:
```node.js
node src/index.js
```
