import { CanvasRenderingContext2D } from "canvas";

import { getAssert, invertMap } from "../../../../../utils.js";
import { Loader } from "../../core/loader.js";
import { BaseItem } from "../base_item.js";

export const boolToName = new Map([
    [false, "false"],
    [true, "true"],
]);
export const nameToBool = invertMap(boolToName);

export const boolToShortcode = new Map([
    [false, "0"],
    [true, "1"],
]);
export const shortcodeToBool = invertMap(boolToShortcode);

export class BooleanItem extends BaseItem {
    static fromString(s: string): BooleanItem | undefined {
        const sl = s.toLowerCase();
        const value = nameToBool.get(sl) ?? shortcodeToBool.get(sl);
        if (value === undefined) {
            return undefined;
        }
        return BooleanItem.fetch(value);
    }

    static fetch(value: boolean): BooleanItem {
        return value ? BOOL_TRUE_SINGLETON : BOOL_FALSE_SINGLETON;
    }

    type: "boolean" = "boolean";

    constructor(
        public value: boolean,
    ) {
        super();
    }

    toString(): string {
        return getAssert(boolToName, this.value);
    }

    equalsImpl(other: this): boolean {
        return this.value === other.value;
    }

    /**
     * Draws the item to a canvas
     */
    drawFullSizeOnCanvas(context: CanvasRenderingContext2D, size: number): void {
        const sprite = this.value
            ? Loader.getSprite("sprites/wires/boolean_true.png")
            : Loader.getSprite("sprites/wires/boolean_false.png");
        sprite.drawCentered(context, size / 2, size / 2, size);
    }
}

export const BOOL_FALSE_SINGLETON = new BooleanItem(false);
export const BOOL_TRUE_SINGLETON = new BooleanItem(true);
