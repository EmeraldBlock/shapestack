import Discord from "discord.js";
import config from "./config/config.json";
export default class BotError extends Error {
    constructor(message, description) {
        super(message);
        this.name = "BotError";
        this.description = description;
    }
    static fromMultiple(botErrors) {
        return new BotError("A few issues...", { botErrors, : .map(botError => botError.description).join("\n\n") });
    }
    getEmbed() {
        return new Discord.MessageEmbed()
            .setColor(config.colors.warn)
            .setTitle(this.message)
            .setDescription(this.description);
    }
}
//# sourceMappingURL=bot-error.js.map