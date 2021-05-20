import Discord from "discord.js";
import config from "./config/config.json";

export default class BotError extends Error {
    description: string;

    constructor(message: string, description: string) {
        super(message);
        this.name = "RRError";
        this.description = description;
    }

    getEmbed(): Discord.MessageEmbed {
        return new Discord.MessageEmbed()
            .setColor(config.colors.warn)
            .setTitle(this.message)
            .setDescription(this.description);
    }
}
