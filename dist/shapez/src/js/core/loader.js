import nodeCanvas, { Canvas } from "canvas";
import { atlasFiles } from "./atlas_definitions.js";
import { AtlasSprite, RegularSprite } from "./sprites.js";
class LoaderImpl {
    sprites = new Map();
    spriteNotFoundSprite = this.makeSpriteNotFoundCanvas();
    /**
     * Fetches a given sprite from the cache
     */
    getSprite(key) {
        return this.sprites.get(key) ?? this.spriteNotFoundSprite;
    }
    internalPreloadImage(key) {
        const url = "./shapez/res_built/atlas/" + key;
        return nodeCanvas.loadImage(url);
    }
    /**
     * Preloads an atlas
     */
    async preloadAtlas(atlas) {
        const image = await this.internalPreloadImage(atlas.getFullSourcePath());
        return this.internalParseAtlas(atlas, image);
    }
    internalParseAtlas({ sprites }, loadedImage) {
        for (const [name, { frame, sourceSize, spriteSourceSize }] of sprites) {
            const link = {
                packedX: frame.x,
                packedY: frame.y,
                packedW: frame.w,
                packedH: frame.h,
                packOffsetX: spriteSourceSize.x,
                packOffsetY: spriteSourceSize.y,
                atlas: loadedImage,
                w: sourceSize.w,
                h: sourceSize.h,
            };
            this.sprites.set(name, new AtlasSprite(link));
        }
    }
    /**
     * Makes the canvas which shows the question mark, shown when a sprite was not found
     */
    makeSpriteNotFoundCanvas() {
        const dims = 128;
        const canvas = new Canvas(dims, dims);
        const context = canvas.getContext("2d");
        context.fillStyle = "#f77";
        context.fillRect(0, 0, dims, dims);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#eee";
        context.font = "25px Arial";
        context.fillText("???", dims / 2, dims / 2);
        const sprite = new RegularSprite(canvas, dims, dims);
        return sprite;
    }
}
export const Loader = new LoaderImpl();
for (const atlasFile of atlasFiles) {
    await Loader.preloadAtlas(atlasFile);
}
//# sourceMappingURL=loader.js.map