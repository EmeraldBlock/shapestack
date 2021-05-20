# Not Gambling

### **IMPORTANT:** This bot is still in early development, so it's **not yet fit for actual use.** There are likely many ways to break it!

## About

**Not Gambling** is a Discord gambling bot... without any gambling! It features ~~a wide variety of gambling games~~ (just Blackjack right now), but there's no concept of permanent currency: You start anew every time, just like a board game.

This bot is written in [TypeScript](https://www.typescriptlang.org/). It's pretty cool!

## Installing

### DISCLAIMER: While these instructions are relatively generic, I am not guaranteeing that following them will not cause any damage to your computer. *Make sure you understand what you are doing!*
<br>

This bot requires [Node.js](https://nodejs.org/). I'm not sure the specific versions that work, but any 16.X should work fine.

Make sure you've created an [application](https://discord.com/developers/applications) in the Discord Developer Portal and have added a bot. ([Tutorial](https://discordjs.guide/preparations/setting-up-a-bot-application.html) from the Discord.js Guide)

### Running

If you just want to run your own local instance of this bot:

1. Download the ZIP of this respository and unzip it somewhere.

   * Alternatively, if you have [git](https://git-scm.com/), you can shallow-clone it to more easily update it in the future.

2. Navigate to the project folder in your command line of choice.

3. Run `npm install --production` to install dependencies.

4. Create a file named `secrets.json` in [`dist/config`](dist/config) with the following format (replace `BOT-TOKEN` with your application's bot's token):
```json
{
    "token": "BOT-TOKEN"
}
```

Now, you can launch the bot by running `npm start` in the project folder.

### Contributing

If you want to contribute or make your own changes to the bot:

1. Follow step 1 of [Running](#Running). It's strongly recommended to use git if you are planning on making any non-minor changes, preferably with a complete clone.

2. Follow step 2 of [Running](#Running).

3. Run `npm install`.

4. Follow step 4 of [Running](#Running), but in [`src/config`](src/config).

Now, you can launch the bot by running `npm dev`. This uses nodemon to re-build and restart the bot whenever a change is made to the source directory [`src`](src). You can also manually build with `npx tsc` and run with `npm start`.
