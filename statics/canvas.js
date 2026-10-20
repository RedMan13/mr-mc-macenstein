try {
    module.exports = require('skia-canvas');
    module.exports.isSkia = true;
} catch (err) {
    console.warn('Could not get skia-canvas!');
    const canvas = require('canvas');
    module.exports = canvas;
    const toBuffer = canvas.Canvas.prototype.toBuffer;
    canvas.Canvas.prototype.toBuffer = function(...args) { return new Promise((g,b) => toBuffer.call(this, (e,r)=>e?b(e):g(r), ...args)) };
    module.exports.FontLibrary = {
        use: (family, path) => canvas.registerFont(path, { family })
    }
    module.exports.isCairo = true;
}
