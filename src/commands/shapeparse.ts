import assert from "assert/strict";

import Discord from "discord.js";

import { Command } from "../index.js";
import { BotError } from "../errors.js";

import { Item, fromString } from "../shapez/src/js/game/item.js";
import * as op from "../shapez/src/js/game/operations.js";
import { Canvas } from "canvas";

export default new Command({
    name: "shapeparse",
    alias: ["parse"],
    desc:
`Performs operations on shapez.io items.`,
    usage:
`<figure it out yourself>`,
    execute: async (message, args) => {
        await message.channel.send(parse(args));
    },
});

class ItemStack extends Array<Item | undefined> {
    execute(inputs: number, outputs: number, operator: (shapes: Array<Item | undefined>) => Array<Item | undefined>) {
        if (inputs > this.length) {
            throw new BotError("Stack Underflow", "idk");
        }
        const shapes = this.splice(this.length - inputs);
        const result = operator(shapes);
        assert(result.length === outputs);
        this.push(...operator(shapes));
    }
}

type ItemOperation = Parameters<ItemStack["execute"]>;

const operationMap = new Map<string, ItemOperation>([
    ["split", [1, 2, ([a]) => [a, a]]],
    ["cut", [1, 2, op.CUTTER]],
    ["left", [2, 1, ([a, b]) => [a]]],
    ["right", [2, 1, ([a, b]) => [b]]],
    ["qcut", [1, 4, op.CUTTER_QUAD]],
    ["q1", [4, 1, ([a, b, c, d]) => [a]]],
    ["q2", [4, 1, ([a, b, c, d]) => [b]]],
    ["q3", [4, 1, ([a, b, c, d]) => [c]]],
    ["q4", [4, 1, ([a, b, c, d]) => [d]]],
    ["rot", [1, 1, op.ROTATER]],
    ["ccw", [1, 1, op.ROTATER_CCW]],
    ["180", [1, 1, op.ROTATER_180]],
    ["stack", [2, 1, op.STACKER]],
    ["trash", [1, 0, op.TRASH]],
    ["mix", [2, 1, op.MIXER]],
    ["mix", [2, 1, op.MIXER]],
    ["paint", [2, 1, op.PAINTER]],
    ["qpaint", [4, 1, op.PAINTER_QUAD]],
    ["read", [1, 1, ([a]) => [a]]],
    ["and", [2, 1, op.AND]],
    ["not", [1, 1, op.NOT]],
    ["xor", [2, 1, op.XOR]],
    ["or", [2, 1, op.OR]],
    ["if", [2, 1, op.IF]],
    ["analyze", [1, 2, op.ANALYZE]],
]);

function parse(args: Array<string>): Discord.MessageOptions {
    const operations = args.map(arg =>
        operationMap.get(arg) ?? <ItemOperation>[0, 1, () => [fromString(arg)]],
    );
    const result = evaluate(operations);
    if (result.length === 0) {
        return { content: "There is nothing to return." };
    }
    const canvas = drawItems(result);
    return { files: [new Discord.MessageAttachment(canvas.toBuffer(), "items.png")] };
}

function evaluate(operations: Array<ItemOperation>): Array<Item | undefined> {
    const stack = new ItemStack();
    for (const operation of operations) {
        stack.execute(...operation);
    }
    return stack;
}

function drawItems(items: Array<Item | undefined>): Canvas {
    const canvas = new Canvas(64 * items.length, 64);
    const context = canvas.getContext("2d");
    for (const [i, item] of items.entries()) {
        item?.drawOnCanvas(context, 64, 64 * i, 0);
    }
    return canvas;
}
