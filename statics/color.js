
function rgbToHsv (rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const x = Math.min(r,g,b);
    const v = Math.max(r,g,b);

    // For grays, hue will be arbitrarily reported as zero. Otherwise, calculate
    let h = 0;
    let s = 0;
    if (x !== v) {
        const f = (r === x) ? g - b : ((g === x) ? b - r : r - g);
        const i = (r === x) ? 3 : ((g === x) ? 5 : 1);
        h = ((i - (f / (v - x))) * 60) % 360;
        s = (v - x) / v;
    }

    return {
        h: h,
        s: s,
        v: v,
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        a: rgb[3]
    };
}
function hsvToRgb (hsv) {
    let h = hsv.h % 360;
    if (h < 0) h += 360;
    const s = Math.max(0, Math.min(hsv.s, 1));
    const v = Math.max(0, Math.min(hsv.v, 1));

    const i = Math.floor(h / 60);
    const f = (h / 60) - i;
    const p = v * (1 - s);
    const q = v * (1 - (s * f));
    const t = v * (1 - (s * (1 - f)));

    let r;
    let g;
    let b;

    switch (i) {
    default:
    case 0:
        r = v;
        g = t;
        b = p;
        break;
    case 1:
        r = q;
        g = v;
        b = p;
        break;
    case 2:
        r = p;
        g = v;
        b = t;
        break;
    case 3:
        r = p;
        g = q;
        b = v;
        break;
    case 4:
        r = t;
        g = p;
        b = v;
        break;
    case 5:
        r = v;
        g = p;
        b = q;
        break;
    }

    return [
        Math.floor(r * 255),
        Math.floor(g * 255),
        Math.floor(b * 255),
        hsv.a ?? 255
    ];
}
function rgbToString(rgb) {
    return '#' + (rgb.map(c => c.toString(16).padStart(2, '0', rgb)).join(''));
}

module.exports.rgbToHsv = rgbToHsv;
module.exports.hsvToRgb = hsvToRgb;
module.exports.rgbToString = rgbToString;