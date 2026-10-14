try {
    module.exports = require('skia-canvas');
    module.exports.isSkia = true;
} catch (err) {
    console.warn('Could not get skia-canvas!');
    const canvas = require('canvas');
    module.exports = canvas;
    module.exports.FontLibrary = {
        use: (family, path) => canvas.registerFont(path, { family })
    }
    module.exports.isCairo = true;
}
