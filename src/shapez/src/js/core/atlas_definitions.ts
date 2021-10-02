import atlasHq from "../../../res_built/atlas/atlas0_hq.json";

type Size = { w: number, h: number };
type Position = { x: number, y: number };
type SpriteDefinition = {
    frame: Position & Size,
    rotated: boolean,
    spriteSourceSize: Position & Size,
    sourceSize: Size,
    trimmed: boolean,
};
type AtlasMeta = {
    image: string,
    format: string,
    size: Size,
    scale: string,
};
type SourceData = {
    frames: Record<string, SpriteDefinition>,
    meta: AtlasMeta,
};

export class AtlasDefinition {
    meta: AtlasMeta;
    sprites: Map<string, SpriteDefinition>;
    sourceFileName: string;

    constructor({ frames, meta }: SourceData) {
        this.meta = meta;
        this.sprites = new Map(Object.entries(frames));
    }

    getFullSourcePath(): string {
        return this.meta.image;
    }
}

export const atlasFiles = [atlasHq].map(f => new AtlasDefinition(f));
