import { Command } from "../index.js";

import config from "../config/config.json";

export default new Command({
    name: "eval",
    alias: ["evil"],
    desc:
`Evaluates arbitrary JS code using eval(). Requires being an owner of the bot. USE WITH CAUTION!`,
    usage:
`<code>`,
    auth: message => config.owners.includes(message.author.id),
    execute: async (message, args) => {
        await message.channel.send(await eval(args.join(" ")), { code: true });
    },
});
