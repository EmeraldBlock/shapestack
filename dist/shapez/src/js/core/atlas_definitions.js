import atlasHq from "../../../res_built/atlas/atlas0_hq.json";
export class AtlasDefinition {
    meta;
    sprites;
    sourceFileName;
    constructor({ frames, meta }) {
        this.meta = meta;
        this.sprites = new Map(Object.entries(frames));
    }
    getFullSourcePath() {
        return this.meta.image;
    }
}
export const atlasFiles = [atlasHq].map(f => new AtlasDefinition(f));
//# sourceMappingURL=atlas_definitions.js.map