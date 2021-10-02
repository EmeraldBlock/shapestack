export class BaseSprite {
    drawCentered(context, x, y, size) {
        this.draw(context, x - size / 2, y - size / 2, size, size);
    }
}
export class AtlasSprite extends BaseSprite {
    link;
    constructor(link) {
        super();
        this.link = link;
    }
    /**
     * Draws the sprite onto a regular context using no contexts
     *
     * @see {BaseSprite.draw}
     */
    draw(context, x, y, w, h) {
        const width = w ?? this.link.w;
        const height = h ?? this.link.h;
        const scaleW = width / this.link.w;
        const scaleH = height / this.link.h;
        context.drawImage(this.link.atlas, this.link.packedX, this.link.packedY, this.link.packedW, this.link.packedH, x + this.link.packOffsetX * scaleW, y + this.link.packOffsetY * scaleH, this.link.packedW * scaleW, this.link.packedH * scaleH);
    }
    drawCentered(context, x, y, size) {
        this.draw(context, x - size / 2, y - size / 2, size, size);
    }
}
export class RegularSprite extends BaseSprite {
    sprite;
    w;
    h;
    constructor(sprite, w, h) {
        super();
        this.sprite = sprite;
        this.w = w;
        this.h = h;
    }
    /**
     * Draws the sprite, do *not* use this for sprites which are rendered! Only for drawing
     * images into buffers
     */
    draw(context, x, y, w, h) {
        context.drawImage(this.sprite, x, y, w, h);
    }
}
//# sourceMappingURL=sprites.js.map