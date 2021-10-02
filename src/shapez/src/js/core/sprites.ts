import assert from "assert";

import { Canvas, CanvasRenderingContext2D, Image } from "canvas";

export abstract class BaseSprite {
    /**
     * Draws the sprite
     */
    abstract draw(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void;

    drawCentered(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
        this.draw(context, x - size / 2, y - size / 2, size, size);
    }
}

/**
 * Position of a sprite within an atlas
 */
export type SpriteAtlasLink = {
    w: number,
    h: number,
    packedX: number,
    packedY: number,
    packOffsetX: number,
    packOffsetY: number,
    packedW: number,
    packedH: number,
    atlas: Image,
};

export class AtlasSprite extends BaseSprite {
    constructor(
        public link: SpriteAtlasLink,
    ) {
        super();
    }

    /**
     * Draws the sprite onto a regular context using no contexts
     *
     * @see {BaseSprite.draw}
     */
    draw(context: CanvasRenderingContext2D, x: number, y: number, w?: number, h?: number): void {
        const width = w ?? this.link.w;
        const height = h ?? this.link.h;

        const scaleW = width / this.link.w;
        const scaleH = height / this.link.h;

        context.drawImage(
            this.link.atlas,

            this.link.packedX,
            this.link.packedY,
            this.link.packedW,
            this.link.packedH,

            x + this.link.packOffsetX * scaleW,
            y + this.link.packOffsetY * scaleH,
            this.link.packedW * scaleW,
            this.link.packedH * scaleH,
        );
    }

    drawCentered(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
        this.draw(context, x - size / 2, y - size / 2, size, size);
    }
}

export class RegularSprite extends BaseSprite {
    constructor(
        public sprite: Canvas | Image,
        public w: number,
        public h: number,
    ) {
        super();
    }

    /**
     * Draws the sprite, do *not* use this for sprites which are rendered! Only for drawing
     * images into buffers
     */
    draw(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
        context.drawImage(this.sprite, x, y, w, h);
    }
}
