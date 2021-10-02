import { CanvasRenderingContext2D } from "canvas";

import { getAssert, invertMap } from "../../../../../utils.js";

import { Loader } from "../../core/loader.js";
import { BaseItem } from "../base_item.js";
import { BaseSprite } from "../../core/sprites.js";

export enum Color {
    red = 0b001,
    green = 0b010,
    blue = 0b100,

    yellow = 0b011,
    purple = 0b101,
    cyan = 0b110,

    white = 0b111,
    uncolored = 0b000,
}

export const colorToName = new Map([
    [Color.red, "red"],
    [Color.green, "green"],
    [Color.blue, "blue"],

    [Color.yellow, "yellow"],
    [Color.purple, "purple"],
    [Color.cyan, "cyan"],

    [Color.white, "white"],
    [Color.uncolored, "uncolored"],
]);
export const nameToColor = invertMap(colorToName);

export const colorToShortcode = new Map([
    [Color.red, "r"],
    [Color.green, "g"],
    [Color.blue, "b"],

    [Color.yellow, "y"],
    [Color.purple, "p"],
    [Color.cyan, "c"],

    [Color.white, "w"],
    [Color.uncolored, "u"],
]);
export const shortcodeToColor = invertMap(colorToShortcode);

export const colorToHexCode = new Map([
    [Color.red, "#ff666a"],
    [Color.green, "#78ff66"],
    [Color.blue, "#66a7ff"],

    // red + green
    [Color.yellow, "#fcf52a"],

    // red + blue
    [Color.purple, "#dd66ff"],

    // blue + green
    [Color.cyan, "#00fcff"],

    // blue + green + red
    [Color.white, "#ffffff"],

    [Color.uncolored, "#aaaaaa"],
]);

export class ColorItem extends BaseItem {
    static fromString(s: string): ColorItem | undefined {
        const sl = s.toLowerCase();
        const color = nameToColor.get(sl) ?? shortcodeToColor.get(sl);
        if (color === undefined) {
            return undefined;
        }
        return ColorItem.fetch(color);
    }

    static fetch(color: Color): ColorItem {
        return getAssert(COLOR_ITEM_SINGLETONS, color);
    }

    type: "color" = "color";

    cachedSprite: BaseSprite;

    constructor(
        public color: Color,
    ) {
        super();
    }

    toString(): string {
        return getAssert(colorToName, this.color);
    }

    equalsImpl(other: this): boolean {
        return this.color === other.color;
    }

    drawFullSizeOnCanvas(context: CanvasRenderingContext2D, size: number): void {
        if (this.cachedSprite === undefined) {
            this.cachedSprite = Loader.getSprite("sprites/colors/" + getAssert(colorToName, this.color) + ".png");
        }
        this.cachedSprite.drawCentered(context, size / 2, size / 2, size);
    }
}

export const COLOR_ITEM_SINGLETONS = new Map<Color, ColorItem>();

for (const color of Object.values(Color)) {
    if (typeof color === "string") continue;
    COLOR_ITEM_SINGLETONS.set(color, new ColorItem(color));
}
