import { getAssert, invertMap } from "../../../../../utils.js";
import { Loader } from "../../core/loader.js";
import { BaseItem } from "../base_item.js";
export var Color;
(function (Color) {
    Color[Color["red"] = 1] = "red";
    Color[Color["green"] = 2] = "green";
    Color[Color["blue"] = 4] = "blue";
    Color[Color["yellow"] = 3] = "yellow";
    Color[Color["purple"] = 5] = "purple";
    Color[Color["cyan"] = 6] = "cyan";
    Color[Color["white"] = 7] = "white";
    Color[Color["uncolored"] = 0] = "uncolored";
})(Color || (Color = {}));
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
    color;
    static fromString(s) {
        const sl = s.toLowerCase();
        const color = nameToColor.get(sl) ?? shortcodeToColor.get(sl);
        if (color === undefined) {
            return undefined;
        }
        return ColorItem.fetch(color);
    }
    static fetch(color) {
        return getAssert(COLOR_ITEM_SINGLETONS, color);
    }
    type = "color";
    cachedSprite;
    constructor(color) {
        super();
        this.color = color;
    }
    toString() {
        return getAssert(colorToName, this.color);
    }
    equalsImpl(other) {
        return this.color === other.color;
    }
    drawFullSizeOnCanvas(context, size) {
        if (this.cachedSprite === undefined) {
            this.cachedSprite = Loader.getSprite("sprites/colors/" + getAssert(colorToName, this.color) + ".png");
        }
        this.cachedSprite.drawCentered(context, size / 2, size / 2, size);
    }
}
export const COLOR_ITEM_SINGLETONS = new Map();
for (const color of Object.values(Color)) {
    if (typeof color === "string")
        continue;
    COLOR_ITEM_SINGLETONS.set(color, new ColorItem(color));
}
//# sourceMappingURL=color_item.js.map