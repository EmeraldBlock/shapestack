import Discord from "discord.js";
export function floorDiv(a, b) {
    return Math.floor(a / b);
}
export function randFloat(a, b) {
    if (b === undefined) {
        return Math.random() * a;
    }
    else {
        return Math.random() * (b - a) + a;
    }
}
export function randInt(a, b) {
    return Math.floor(randFloat(a, b));
}
export function range(a, b) {
    if (b === undefined) {
        return new Array(a).fill(undefined).map((_, i) => i);
    }
    else {
        return new Array(b - a).fill(undefined).map((_, i) => i + a);
    }
}
export function trimNewlines(str) {
    return str.replace(/^.*\n|\n.*$/g, "");
}
export async function findAsync(collection, callback) {
    return (await Promise.all(collection.map(val => Promise.all([callback(val), val])))).find(result => result[0])?.[1];
}
export async function sleep(ms) {
    return await new Promise(resolve => setTimeout(resolve, ms));
}
export function toEnglishList(array) {
    switch (array.length) {
        case 0: {
            return undefined;
        }
        case 1: {
            return array[0];
        }
        case 2: {
            return `${array[0]} and ${array[1]}`;
        }
        default: {
            return `${array.slice(0, -1).join(", ")}, and ${array[-1]}`;
        }
    }
}
export async function safeDelete(message) {
    try {
        return await message.delete();
    }
    catch (reason) {
        if (reason instanceof Discord.DiscordAPIError && reason.code === 10008) {
            return message;
        }
        throw reason;
    }
}
export function fetchGuildMessageById(id, guild) {
    const textChannelsCache = guild.channels.cache.filter((channel) => channel instanceof Discord.TextChannel);
    return Promise.any(textChannelsCache.map(channel => channel.messages.fetch(id)));
}
//# sourceMappingURL=utils.js.map