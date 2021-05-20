import Discord from "discord.js";
import config from "./config/config.json";
export default class BotError extends Error {
    constructor(message, description) {
        super(message);
        this.name = "RRError";
        this.description = description;
    }
    getEmbed() {
        return new Discord.MessageEmbed()
            .setColor(config.colors.warn)
            .setTitle(this.message)
            .setDescription(this.description);
    }
}
