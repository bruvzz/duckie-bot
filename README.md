Old Discord Bot that I may or may not update later.

# Changelog:
*Updated as of:* `March 8, 2025 // 6:50 AM [EDT]`
- **src/**
  - Updated [index.js](https://github.com/bruvzz/duckie-bot/commit/61b23b8079ab9844037567ff03bdfc722d39f13e)
 
- **src/commands**
  - Created [modlogs.json](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/modlogs.json)

- **src/commands/moderation**
  - Updated [ban.js](https://github.com/bruvzz/duckie-bot/commit/949669ec083572bcd51d68a85eba7dafe7b80eeb)
  - Updated [kick.js](https://github.com/bruvzz/duckie-bot/commit/fceb97cebe983c26a655941fb29b99288da9a433)
  - Created [lock.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/moderation/lock.js)
  - Updated [moderate-nickname.js](https://github.com/bruvzz/duckie-bot/commit/dd2fdba01118802b48679696388fd29faad068f6)
  - Created [modlogs.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/moderation/modlogs.js)
  - Created [nuke.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/moderation/nuke.js)
  - Updated [timeout.js](https://github.com/bruvzz/duckie-bot/commit/b175c7a05b8c59f793fdb9ab8fd7a91d3b18fb99)
  - Created [toggle-role.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/moderation/toggle-role.js)
  - Updated [unban.js](https://github.com/bruvzz/duckie-bot/commit/d2511b625086d8490a7a45406d387e0a92b32852)
  - Created [unlock.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/moderation/unlock.js)
  - Updated [untimeout.js](https://github.com/bruvzz/duckie-bot/commit/db923a1ca9cd5c56b6b2e5e4029c0c15259ca618)
  - Created [warn.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/moderation/warn.js)

- **src/commands/misc**
  - Created [faq.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/misc/faq.js)
  - Created [getkey.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/misc/getkey.js)
  - Updated [help.js](https://github.com/bruvzz/duckie-bot/commit/29d0a353b7df0957ccef140ddbd58c436bd9f606)
  - Created [staff-leave.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/misc/staff-leave.js)
  - Created [vouch.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/misc/vouch.js)

- **src/commands/fun**
  - Created [generatekey.js](https://github.com/bruvzz/duckie-bot/blob/main/src/commands/fun/generatekey.js)

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
