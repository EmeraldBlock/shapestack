import { BooleanItem } from "./items/boolean_item.js";
import { ColorItem } from "./items/color_item.js";
import { ShapeItem } from "./items/shape_item.js";

export type Item = BooleanItem | ColorItem | ShapeItem;
export const itemTypes = [BooleanItem, ColorItem, ShapeItem];

export function fromString(s: string): Item | undefined {
    for (const type of itemTypes) {
        const item = type.fromString(s);
        if (item === undefined) continue;
        return item;
    }
    return undefined;
}
