import { Item } from "./item.js";
import { BooleanItem, BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON } from "./items/boolean_item.js";
import { Color, ColorItem } from "./items/color_item.js";
import { ShapeItem, ShapeLayer } from "./items/shape_item.js";

/**
 * Returns whether the item is Boolean and TRUE
 */
export function isTrueItem(item?: Item): boolean {
    return item !== undefined && item.type === "boolean" && item.value;
}

/**
 * Returns whether the item is truthy
 */
export function isTruthyItem(item?: Item): boolean {
    if (item === undefined) {
        return false;
    }

    if (item.type === "boolean") {
        return item.value;
    }

    return true;
}

class ItemError extends Error {
    constructor(
        public type: string,
        public argument: number,
    ) {
        super(`Argument ${argument} is not a ${type}`);
        this.name = "ItemError";
    }
}

function assertBoolean(item: Item | undefined, argument: number): asserts item is BooleanItem {
    if (item === undefined || item.type !== "boolean") {
        throw new ItemError("boolean", argument);
    }
}
function assertColor(item: Item | undefined, argument: number): asserts item is ColorItem {
    if (item === undefined || item.type !== "color") {
        throw new ItemError("color", argument);
    }
}
function assertColorUndefined(item: Item | undefined, argument: number): asserts item is ColorItem | undefined {
    if (item !== undefined && item.type !== "color") {
        throw new ItemError("color or undefined", argument);
    }
}
function assertShape(item: Item | undefined, argument: number): asserts item is ShapeItem {
    if (item === undefined || item.type !== "shape") {
        throw new ItemError("shape", argument);
    }
}
function isShape(item: Item | undefined): item is ShapeItem {
    return item === undefined || item.type !== "shape"
        ? false
        : true;
}

/**
 * Returns a definition with only the given quadrants
 */
function filterQuadrants(shape: ShapeItem, includeQuadrants: Array<number>): ShapeItem | undefined {
    const newLayers = shape.cloneLayers();
    for (let layerIndex = 0; layerIndex < newLayers.length; ++layerIndex) {
        const quadrants = newLayers[layerIndex];
        let anyContents = false;
        for (let quadrantIndex = 0; quadrantIndex < 4; ++quadrantIndex) {
            if (includeQuadrants.indexOf(quadrantIndex) < 0) {
                quadrants[quadrantIndex] = undefined;
            } else if (quadrants[quadrantIndex] !== undefined) {
                anyContents = true;
            }
        }

        // Check if the layer is entirely empty
        if (!anyContents) {
            newLayers.splice(layerIndex, 1);
            layerIndex -= 1;
        }
    }

    if (newLayers.length === 0) {
        return undefined;
    }
    return ShapeItem.fetch(newLayers);
}

/**
 * Generates a definition for splitting a shape definition in two halfs
 */
export function CUTTER([shape]: [Item?]): [ShapeItem?, ShapeItem?] {
    assertShape(shape, 1);

    return [
        filterQuadrants(shape, [2, 3]),
        filterQuadrants(shape, [0, 1]),
    ];
}
/**
 * Generates a definition for splitting a shape definition in four quads
 */
export function CUTTER_QUAD([shape]: [Item?]): [ShapeItem?, ShapeItem?, ShapeItem?, ShapeItem?] {
    assertShape(shape, 1);

    return [
        filterQuadrants(shape, [0]),
        filterQuadrants(shape, [1]),
        filterQuadrants(shape, [2]),
        filterQuadrants(shape, [3]),
    ];
}
/**
 * Returns a definition which was rotated clockwise
 */
export function ROTATER([shape]: [Item?]): [ShapeItem] {
    assertShape(shape, 1);

    const newLayers = shape.cloneLayers();
    for (let layerIndex = 0; layerIndex < newLayers.length; ++layerIndex) {
        const quadrants = newLayers[layerIndex];
        quadrants.unshift(quadrants[3]);
        quadrants.pop();
    }
    return [ShapeItem.fetch(newLayers)];
}
/**
 * Returns a definition which was rotated counter clockwise
 */
export function ROTATER_CCW([shape]: [Item?]): [ShapeItem] {
    assertShape(shape, 1);

    const newLayers = shape.cloneLayers();
    for (let layerIndex = 0; layerIndex < newLayers.length; ++layerIndex) {
        const quadrants = newLayers[layerIndex];
        quadrants.push(quadrants[0]);
        quadrants.shift();
    }
    return [ShapeItem.fetch(newLayers)];
}
/**
 * Returns a definition which was rotated 180 degrees
 */
export function ROTATER_180([shape]: [Item?]): [ShapeItem] {
    assertShape(shape, 1);

    const newLayers = shape.cloneLayers();
    for (let layerIndex = 0; layerIndex < newLayers.length; ++layerIndex) {
        const quadrants = newLayers[layerIndex];
        quadrants.push(quadrants.shift(), quadrants.shift());
    }
    return [ShapeItem.fetch(newLayers)];
}
/**
 * Stacks the given shape definition on top.
 */
export function STACKER([shape1, shape2]: [Item?, Item?]): [ShapeItem] {
    assertShape(shape1, 1);
    assertShape(shape2, 2);

    const bottomShapeLayers = shape1.layers;
    const bottomShapeHighestLayerByQuad = [-1, -1, -1, -1];

    for (let layer = bottomShapeLayers.length - 1; layer >= 0; --layer) {
        const shapeLayer = bottomShapeLayers[layer];
        for (let quad = 0; quad < 4; ++quad) {
            const shapeQuad = shapeLayer[quad];
            if (shapeQuad !== undefined && bottomShapeHighestLayerByQuad[quad] < layer) {
                bottomShapeHighestLayerByQuad[quad] = layer;
            }
        }
    }

    const topShapeLayers = shape2.layers;
    const topShapeLowestLayerByQuad = [4, 4, 4, 4];

    for (let layer = 0; layer < topShapeLayers.length; ++layer) {
        const shapeLayer = topShapeLayers[layer];
        for (let quad = 0; quad < 4; ++quad) {
            const shapeQuad = shapeLayer[quad];
            if (shapeQuad !== undefined && topShapeLowestLayerByQuad[quad] > layer) {
                topShapeLowestLayerByQuad[quad] = layer;
            }
        }
    }

    /**
     * We want to find the number `layerToMergeAt` such that when the top shape is placed at that
     * layer, the smallest gap between shapes is only 1. Instead of doing a guess-and-check method to
     * find the appropriate layer, we just calculate all the gaps assuming a merge at layer 0, even
     * though they go negative, and calculating the number to add to it so the minimum gap is 1 (ends
     * up being 1 - minimum).
     */
    const gapsBetweenShapes = <Array<number>>[];
    for (let quad = 0; quad < 4; ++quad) {
        gapsBetweenShapes.push(topShapeLowestLayerByQuad[quad] - bottomShapeHighestLayerByQuad[quad]);
    }
    const smallestGapBetweenShapes = Math.min(...gapsBetweenShapes);
    // Can't merge at a layer lower than 0
    const layerToMergeAt = Math.max(1 - smallestGapBetweenShapes, 0);

    const mergedLayers = shape1.cloneLayers();
    for (let layer = mergedLayers.length; layer < layerToMergeAt + topShapeLayers.length; ++layer) {
        mergedLayers.push([undefined, undefined, undefined, undefined]);
    }

    for (let layer = 0; layer < topShapeLayers.length; ++layer) {
        const layerMergingAt = layerToMergeAt + layer;
        const bottomShapeLayer = mergedLayers[layerMergingAt];
        const topShapeLayer = topShapeLayers[layer];
        for (let quad = 0; quad < 4; quad++) {
            bottomShapeLayer[quad] = bottomShapeLayer[quad] ?? topShapeLayer[quad];
        }
    }

    // Limit to 4 layers at max
    mergedLayers.splice(4);

    return [ShapeItem.fetch(mergedLayers)];
}
export function TRASH([item]: [Item?]): [] {
    return [];
}
export function MIXER([color1, color2]: [Item?, Item?]): [ColorItem] {
    assertColor(color1, 1);
    assertColor(color2, 2);

    return [ColorItem.fetch(color1.color | color2.color)];
}
/**
 * Clones the shape and colors everything in the given color
 */
export function PAINTER([shape, color1]: [Item?, Item?]): [ShapeItem] {
    assertShape(shape, 1);
    assertColor(color1, 2);
    const color = color1.color;

    const newLayers = shape.cloneLayers();

    for (let layerIndex = 0; layerIndex < newLayers.length; ++layerIndex) {
        const quadrants = newLayers[layerIndex];
        for (let quadrantIndex = 0; quadrantIndex < 4; ++quadrantIndex) {
            const item = quadrants[quadrantIndex];
            if (item !== undefined) {
                item.color = color;
            }
        }
    }
    return [ShapeItem.fetch(newLayers)];
}
/**
 * Clones the shape and colors everything in the given colors
 */
export function PAINTER_QUAD([shape, color1, color2, color3, color4]: [Item?, Item?, Item?, Item?, Item?]): [ShapeItem] {
    assertShape(shape, 1);
    assertColorUndefined(color1, 2);
    assertColorUndefined(color2, 3);
    assertColorUndefined(color3, 4);
    assertColorUndefined(color4, 5);
    const colors = [color1?.color, color2?.color, color3?.color, color4?.color];

    const newLayers = shape.cloneLayers();

    for (let layerIndex = 0; layerIndex < newLayers.length; ++layerIndex) {
        const quadrants = newLayers[layerIndex];
        for (let quadrantIndex = 0; quadrantIndex < 4; ++quadrantIndex) {
            const item = quadrants[quadrantIndex];
            if (item !== undefined) {
                item.color = colors[quadrantIndex] ?? item.color;
            }
        }
    }
    return [ShapeItem.fetch(newLayers)];
}

export function AND([item1, item2]: [Item?, Item?]): [BooleanItem?] {
    return [BooleanItem.fetch(isTruthyItem(item1) && isTruthyItem(item2))];
}
export function NOT([item]: [Item?]): [BooleanItem?] {
    return [BooleanItem.fetch(!isTruthyItem(item))];
}
export function XOR([item1, item2]: [Item?, Item?]): [BooleanItem?] {
    return [BooleanItem.fetch(isTruthyItem(item1) !== isTruthyItem(item2))];
}
export function OR([item1, item2]: [Item?, Item?]): [BooleanItem?] {
    return [BooleanItem.fetch(isTruthyItem(item1) || isTruthyItem(item2))];
}
export function IF([flag, value]: [Item?, Item?]): [Item?] {
    return [isTruthyItem(flag) ? value : undefined];
}
// export function ROTATE([shape]: [Item?]): [ShapeItem?] {
//     if (!isShape(shape)) {
//         return [undefined];
//     }

//     const newLayers = shape.cloneLayers();
//     for (let layerIndex = 0; layerIndex < newLayers.length; ++layerIndex) {
//         const quadrants = newLayers[layerIndex];
//         quadrants.unshift(quadrants[3]);
//         quadrants.pop();
//     }
//     return [ShapeItem.fetch(newLayers)];
// }
export function ANALYZE([shape]: [Item?]): [ShapeItem?, ColorItem?] {
    if (!isShape(shape)) {
        return [undefined, undefined];
    }
    const topRight = shape.layers[0][0];

    if (topRight === undefined) {
        return [undefined, undefined];
    }

    const newDefinition = <Array<ShapeLayer>>[
        [
            { subShape: topRight.subShape, color: Color.uncolored },
            { subShape: topRight.subShape, color: Color.uncolored },
            { subShape: topRight.subShape, color: Color.uncolored },
            { subShape: topRight.subShape, color: Color.uncolored },
        ],
    ];

    return [
        ShapeItem.fetch(newDefinition),
        ColorItem.fetch(topRight.color),
    ];
}
// export function CUT([shape]: [Item?]): [ShapeItem?, ShapeItem?] {
//     if (!isShape(shape)) {
//         return [undefined, undefined];
//     }

//     return [
//         filterQuadrants(shape, [2, 3]),
//         filterQuadrants(shape, [0, 1]),
//     ];
// }
