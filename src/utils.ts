import Discord from "discord.js";

export function floorDiv(a: number, b: number): number {
    return Math.floor(a / b);
}

export function randFloat(a: number, b?: number): number {
    if (b === undefined) {
        return Math.random() * a;
    } else {
        return Math.random() * (b - a) + a;
    }
}

export function randInt(a: number, b?: number): number {
    return Math.floor(randFloat(a, b));
}

export function range(a: number, b?: number): Array<number> {
    if (b === undefined) {
        return new Array(a).fill(undefined).map((_, i) => i);
    } else {
        return new Array(b-a).fill(undefined).map((_, i) => i+a);
    }
}

export function trimNewlines(str: string): string {
    return str.replace(/^.*\n|\n.*$/g, "");
}

export async function findAsync<T>(collection: Discord.Collection<unknown, T>, callback: (val: T) => Promise<boolean>): Promise<T | undefined> {
    return (await Promise.all(collection.map(val => Promise.all([callback(val), val])))).find(result => result[0])?.[1];
}

export async function sleep(ms: number): Promise<void> {
    return await new Promise(resolve => setTimeout(resolve, ms));
}

export function fetchGuildMessageById(id: Discord.Snowflake, guild: Discord.Guild): Promise<Discord.Message> {
    const textChannelsCache = guild.channels.cache.filter((channel): channel is Discord.TextChannel => channel instanceof Discord.TextChannel);
    return Promise.any(textChannelsCache.map(channel => channel.messages.fetch(id)));
}
