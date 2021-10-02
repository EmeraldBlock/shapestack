import assert from "assert/strict";

import { getAssert, invertMap } from "../../../../../utils.js";

import { BaseItem } from "../base_item.js";
import { THEME } from "../theme.js";
import { Color, colorToHexCode, colorToShortcode, shortcodeToColor } from "./color_item.js";

function beginCircle(context: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    context.beginPath();

    if (r < 0.05) {
        context.rect(x, y, 1, 1);
        return;
    }

    context.arc(x, y, r, 0, 2.0 * Math.PI);
}

function radians(degrees: number): number {
    return (degrees * Math.PI) / 180.0;
}

export enum SubShape {
    rect = "rect",
    circle = "circle",
    star = "star",
    windmill = "windmill",
}

export const subShapeToShortcode = new Map([
    [SubShape.rect, "R"],
    [SubShape.circle, "C"],
    [SubShape.star, "S"],
    [SubShape.windmill, "W"],
]);
export const shortcodeToSubShape = invertMap(subShapeToShortcode);

type ShapeLayerItem = { subShape: SubShape, color: Color };
/**
 * Order is Q1 (tr), Q2(br), Q3(bl), Q4(tl)
 */
export type ShapeLayer = [ShapeLayerItem?, ShapeLayerItem?, ShapeLayerItem?, ShapeLayerItem?];

function layersToString(layers: Array<ShapeLayer>): string {
    let id = "";
    for (let layerIndex = 0; layerIndex < layers.length; ++layerIndex) {
        const layer = layers[layerIndex];

        for (let quadrant = 0; quadrant < layer.length; ++quadrant) {
            const item = layer[quadrant];
            if (item !== undefined) {
                id += getAssert(subShapeToShortcode, item.subShape) + getAssert(colorToShortcode, item.color);
            } else {
                id += "--";
            }
        }

        if (layerIndex < layers.length - 1) {
            id += ":";
        }
    }
    return id;
}

export class ShapeItem extends BaseItem {
    /**
     * INTERNAL
     * Checks if a given string is a valid short key
     */
    static validString(key: string): boolean {
        const sourceLayers = key.split(":");
        const layers = <Array<ShapeLayer>>[];
        for (let i = 0; i < sourceLayers.length; ++i) {
            const text = sourceLayers[i];
            if (text.length !== 8) {
                return false;
            }

            const quads = <ShapeLayer>[undefined, undefined, undefined, undefined];
            let anyFilled = false;
            for (let quad = 0; quad < 4; ++quad) {
                const shapeText = text[quad * 2 + 0];
                const colorText = text[quad * 2 + 1];
                const subShape = shortcodeToSubShape.get(shapeText);
                const color = shortcodeToColor.get(colorText);

                // Valid shape
                if (subShape !== undefined) {
                    if (color === undefined) {
                        // Invalid color
                        return false;
                    }
                    quads[quad] = {
                        subShape,
                        color,
                    };
                    anyFilled = true;
                } else if (shapeText === "-") {
                    // Make sure color is empty then, too
                    if (colorText !== "-") {
                        return false;
                    }
                } else {
                    // Invalid shape key
                    return false;
                }
            }

            if (!anyFilled) {
                // Empty layer
                return false;
            }
            layers.push(quads);
        }

        if (layers.length === 0 || layers.length > 4) {
            return false;
        }

        return true;
    }

    /**
     * Generates the definition from the given short key
     */
    static fromString(key: string): ShapeItem | undefined {
        if (!ShapeItem.validString(key)) {
            return undefined;
        }

        const sourceLayers = key.split(":");
        const layers = <Array<ShapeLayer>>[];
        for (let i = 0; i < sourceLayers.length; ++i) {
            const text = sourceLayers[i];
            assert(text.length === 8, "Invalid shape short key: " + key);

            const quads = <ShapeLayer>[undefined, undefined, undefined, undefined];
            for (let quad = 0; quad < 4; ++quad) {
                const shapeText = text[quad * 2 + 0];
                const subShape = shortcodeToSubShape.get(shapeText);
                const color = shortcodeToColor.get(text[quad * 2 + 1]);
                if (subShape !== undefined) {
                    assert(color !== undefined, `Invalid shape short key: ${key}`);
                    quads[quad] = {
                        subShape,
                        color,
                    };
                } else if (shapeText !== "-") {
                    assert.fail(`Invalid shape key: ${shapeText}`);
                }
            }
            layers.push(quads);
        }

        const definition = new ShapeItem(layers);
        return definition;
    }

    static fetch(layers: Array<ShapeLayer>): ShapeItem {
        const cached = SHAPE_ITEM_CACHE.get(layersToString(layers));
        if (cached !== undefined) {
            return cached;
        }
        return new ShapeItem(layers);
    }

    type: "shape" = "shape";

    constructor(
        public layers: Array<ShapeLayer>,
    ) {
        super();
    }

    /**
     * Returns a unique id for this shape
     */
    toString(): string {
        return layersToString(this.layers);
    }

    /**
     * Internal method to clone the shape definition
     */
    cloneLayers(): Array<ShapeLayer> {
        return JSON.parse(JSON.stringify(this.layers), (key, value: unknown) => value === null ? undefined : value) as Array<ShapeLayer>;
    }

    /**
     * Draws the item to a canvas
     */
    drawFullSizeOnCanvas(context: CanvasRenderingContext2D, size: number): void {
        context.translate(size / 2, size / 2);
        context.scale(size / 23, size / 23);

        context.fillStyle = "#e9ecf7";

        const quadrantSize = 10;
        const quadrantHalfSize = quadrantSize / 2;

        context.fillStyle = THEME.items.circleBackground;
        beginCircle(context, 0, 0, quadrantSize * 1.15);
        context.fill();

        for (let layerIndex = 0; layerIndex < this.layers.length; ++layerIndex) {
            const quadrants = this.layers[layerIndex];

            const layerScale = Math.max(0.1, 0.9 - layerIndex * 0.22);

            for (let quadrantIndex = 0; quadrantIndex < 4; ++quadrantIndex) {
                const quadrant = quadrants[quadrantIndex];
                if (quadrant === undefined) {
                    continue;
                }
                const { subShape, color } = quadrant;

                const centerQuadrantX = ([0, 1].includes(quadrantIndex) ? 1 : -1) * quadrantHalfSize;
                const centerQuadrantY = ([1, 2].includes(quadrantIndex) ? 1 : -1) * quadrantHalfSize;

                const rotation = radians(quadrantIndex * 90);

                context.translate(centerQuadrantX, centerQuadrantY);
                context.rotate(rotation);

                context.fillStyle = getAssert(colorToHexCode, color);
                context.strokeStyle = THEME.items.outline;
                context.lineWidth = THEME.items.outlineWidth;

                const insetPadding = 0.0;

                switch (subShape) {
                case SubShape.rect: {
                    context.beginPath();
                    const dims = quadrantSize * layerScale;
                    context.rect(
                        insetPadding + -quadrantHalfSize,
                        -insetPadding + quadrantHalfSize - dims,
                        dims,
                        dims,
                    );

                    break;
                }
                case SubShape.star: {
                    context.beginPath();
                    const dims = quadrantSize * layerScale;

                    const originX = insetPadding - quadrantHalfSize;
                    const originY = -insetPadding + quadrantHalfSize - dims;

                    const moveInwards = dims * 0.4;
                    context.moveTo(originX, originY + moveInwards);
                    context.lineTo(originX + dims, originY);
                    context.lineTo(originX + dims - moveInwards, originY + dims);
                    context.lineTo(originX, originY + dims);
                    context.closePath();
                    break;
                }

                case SubShape.windmill: {
                    context.beginPath();
                    const dims = quadrantSize * layerScale;

                    const originX = insetPadding - quadrantHalfSize;
                    const originY = -insetPadding + quadrantHalfSize - dims;
                    const moveInwards = dims * 0.4;
                    context.moveTo(originX, originY + moveInwards);
                    context.lineTo(originX + dims, originY);
                    context.lineTo(originX + dims, originY + dims);
                    context.lineTo(originX, originY + dims);
                    context.closePath();
                    break;
                }

                case SubShape.circle: {
                    context.beginPath();
                    context.moveTo(insetPadding + -quadrantHalfSize, -insetPadding + quadrantHalfSize);
                    context.arc(
                        insetPadding + -quadrantHalfSize,
                        -insetPadding + quadrantHalfSize,
                        quadrantSize * layerScale,
                        -Math.PI * 0.5,
                        0,
                    );
                    context.closePath();
                    break;
                }

                default: {
                    assert(false, `Unknown subshape: ${subShape}`);
                }
                }

                context.fill();
                context.stroke();

                context.rotate(-rotation);
                context.translate(-centerQuadrantX, -centerQuadrantY);
            }
        }
    }
}

const SHAPE_ITEM_CACHE = new Map<string, ShapeItem>();
