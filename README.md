# Embot

### **IMPORTANT:** This bot is still in early development, so it's **not yet fit for actual use.** There are likely many ways to break it!

## About

**Embot** is a Discord bot core. It features a help command, custom errors, and some utility functions.

This bot is written in [TypeScript](https://www.typescriptlang.org/). It's pretty cool!

## Using

### DISCLAIMER: While these instructions are relatively generic, I am not guaranteeing that following them will not cause any damage to your computer. *Make sure you understand what you are doing!*
<br>

This bot requires [Node.js](https://nodejs.org/). I'm not sure the specific versions that work, but any 16.7+ should work fine.

Make sure you've created an [application](https://discord.com/developers/applications) in the Discord Developer Portal and have added a bot. ([Tutorial](https://discordjs.guide/preparations/setting-up-a-bot-application.html) from the Discord.js Guide)

### Editing

If you want to use this bot core or contribute:

1. Clone the repo with [git](https://git-scm.com/).

2. Install dependencies by running `npm install` in the repo folder.

3. Rename [`secrets.example.json`](src/config/secrets.example.json) to `secrets.json` and fill in your application's bot token.

Now, you can launch the bot by running `npm run dev`. This uses [nodemon](https://nodemon.io/) to re-build and restart the bot whenever a change is made to the source directory [`src`](src). You can also manually build with `npm run build` and run with `npm start`.

Commands can be added in [`src/commands`](src/commands). See the default commands and typedefs for syntax.
