import assert from "assert/strict";

import { CanvasRenderingContext2D } from "canvas";

/**
 * Class for items on belts etc. Not an entity for performance reasons
 */
export abstract class BaseItem {
    static fromString(s: string): BaseItem | undefined {
        assert.fail("abstract");
    }

    static fetch(...args: Array<unknown>): BaseItem | undefined {
        assert.fail("abstract");
    }

    abstract type: string;

    /**
     * Returns a string id of the item
     */
    abstract toString(): string;

    typeEquals(other: BaseItem): other is this {
        return this.type === other.type;
    }

    /**
     * Returns if the item equals the other itme
     */
    equals(other: BaseItem): boolean {
        if (!this.typeEquals(other)) {
            return false;
        }
        return this.equalsImpl(other);
    }

    /**
     * Override for custom comparison
     */
    equalsImpl(other: this): boolean {
        return this.toString() === other.toString();
    }

    /**
     * Draws the item to a canvas
     */
    abstract drawFullSizeOnCanvas(context: CanvasRenderingContext2D, size: number): void;

    drawOnCanvas(context: CanvasRenderingContext2D, size: number, x: number, y: number): void {
        context.save();
        context.translate(x, y);
        this.drawFullSizeOnCanvas(context, size);
        context.restore();
    }
}
