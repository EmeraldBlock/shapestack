import Discord from "discord.js";
import config from "./config/config.json";
export class BotError extends Error {
    constructor(message, description) {
        super(message);
        this.name = "BotError";
        this.description = description;
    }
    getEmbed() {
        return new Discord.MessageEmbed({
            title: this.message,
            description: this.description,
            color: config.colors.warn,
        });
    }
}
export class AggregateBotError extends AggregateError {
    constructor(botErrors) {
        super(botErrors, botErrors.map(botError => botError.message).join(", "));
        this.botErrors = botErrors;
        this.name = "MultiBotError";
    }
    static fromBotErrors(botErrors) {
        if (botErrors.length === 1) {
            return botErrors[0];
        }
        else {
            return new this(botErrors);
        }
    }
    getEmbed() {
        return new Discord.MessageEmbed({
            color: config.colors.warn,
            fields: this.botErrors.map(botError => ({
                name: botError.message,
                value: botError.description,
            })),
        });
    }
}
//# sourceMappingURL=errors.js.map