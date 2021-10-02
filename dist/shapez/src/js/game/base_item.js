import assert from "assert/strict";
/**
 * Class for items on belts etc. Not an entity for performance reasons
 */
export class BaseItem {
    static fromString(s) {
        assert.fail("abstract");
    }
    static fetch(...args) {
        assert.fail("abstract");
    }
    typeEquals(other) {
        return this.type === other.type;
    }
    /**
     * Returns if the item equals the other itme
     */
    equals(other) {
        if (!this.typeEquals(other)) {
            return false;
        }
        return this.equalsImpl(other);
    }
    /**
     * Override for custom comparison
     */
    equalsImpl(other) {
        return this.toString() === other.toString();
    }
    drawOnCanvas(context, size, x, y) {
        context.save();
        context.translate(x, y);
        this.drawFullSizeOnCanvas(context, size);
        context.restore();
    }
}
//# sourceMappingURL=base_item.js.map