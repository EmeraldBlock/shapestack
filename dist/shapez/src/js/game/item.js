import { BooleanItem } from "./items/boolean_item.js";
import { ColorItem } from "./items/color_item.js";
import { ShapeItem } from "./items/shape_item.js";
export const itemTypes = [BooleanItem, ColorItem, ShapeItem];
export function fromString(s) {
    for (const type of itemTypes) {
        const item = type.fromString(s);
        if (item === undefined)
            continue;
        return item;
    }
    return undefined;
}
//# sourceMappingURL=item.js.map