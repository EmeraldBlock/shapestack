import { assert } from "console";
import { Canvas } from "canvas";
import { globalConfig } from "./config.js";
/**
 * Enables images smoothing on a context
 * @param {CanvasRenderingContext2D} context
 */
export function enableImageSmoothing(context) {
    context.imageSmoothingEnabled = true;
    context.webkitImageSmoothingEnabled = true;
    // @ts-ignore
    context.imageSmoothingQuality = globalConfig.smoothing.quality;
}
/**
 * Disables image smoothing on a context
 * @param {CanvasRenderingContext2D} context
 */
export function disableImageSmoothing(context) {
    context.imageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
}
/**
 * Creates a new offscreen buffer
 * @param {Number} w
 * @param {Number} h
 * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]}
 */
export function makeOffscreenBuffer(w, h, { smooth = true, reusable = true, label = "buffer" }) {
    assert(w > 0 && h > 0, "W or H < 0");
    if (w < 1 || h < 1) {
        w = Math.max(1, w);
        h = Math.max(1, h);
    }
    w = Math.floor(w);
    h = Math.floor(h);
    let canvas = null;
    let context = null;
    // None found , create new one
    if (!canvas) {
        canvas = new Canvas();
        context = canvas.getContext("2d" /*, { alpha } */);
        canvas.width = w;
        canvas.height = h;
        // Initial state
        context.save();
    }
    if (smooth) {
        enableImageSmoothing(context);
    }
    else {
        disableImageSmoothing(context);
    }
    return [canvas, context];
}
//# sourceMappingURL=buffer_utils.js.map