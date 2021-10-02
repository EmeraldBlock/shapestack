import nodeCanvas, { Canvas, Image } from "canvas";

import { AtlasDefinition, atlasFiles } from "./atlas_definitions.js";

import { AtlasSprite, BaseSprite, RegularSprite, SpriteAtlasLink } from "./sprites.js";

class LoaderImpl {
    sprites = new Map<string, BaseSprite>();
    spriteNotFoundSprite: BaseSprite = this.makeSpriteNotFoundCanvas();

    /**
     * Fetches a given sprite from the cache
     */
    getSprite(key: string): BaseSprite {
        return this.sprites.get(key) ?? this.spriteNotFoundSprite;
    }

    internalPreloadImage(key: string): Promise<Image> {
        const url = "./shapez/res_built/atlas/" + key;
        return nodeCanvas.loadImage(url);
    }

    /**
     * Preloads an atlas
     */
    async preloadAtlas(atlas: AtlasDefinition): Promise<void> {
        const image = await this.internalPreloadImage(atlas.getFullSourcePath());
        return this.internalParseAtlas(atlas, image);
    }

    internalParseAtlas({ sprites }: AtlasDefinition, loadedImage: Image): void {
        for (const [name, { frame, sourceSize, spriteSourceSize }] of sprites) {
            const link: SpriteAtlasLink = {
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
