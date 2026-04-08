const pixelLength = (32 * 32 * 4) / 8; // (imageWidth * imageHeight * colorBytes) / walkLength
process.on('message', ([segments, pixels]) => {
    const weights = [];
    let idx = 0;
    let emojiIdx = 0;
    const loop = setInterval(() => {
        const start = Date.now();
        head: for (; true; idx++) {
            if (Date.now() - start > 2000) break head;
            if (idx >= segments.length) {
                process.send(weights.map(emojis => emojis.sort((a,b) => a.weight - b.weight)[0].emojiIdx));
                clearInterval(loop);
                return;
            }
            if (emojiIdx === 0) weights[idx] = [];
            for (; emojiIdx < pixels.length; emojiIdx++) {
                if (Date.now() - start > 2000) break head;
                weights[idx][emojiIdx] = { weight: 0, emojiIdx };
                for (let i = 0; i < pixels[emojiIdx].length / 8; i += 8) {
                    weights[idx][emojiIdx].weight += Math.abs(segments[idx][i] - pixels[emojiIdx][i]) +
                        Math.abs(segments[idx][i +1] - pixels[emojiIdx][i +1]) +
                        Math.abs(segments[idx][i +2] - pixels[emojiIdx][i +2]) +
                        Math.abs(segments[idx][i +3] - pixels[emojiIdx][i +3]) +
                        Math.abs(segments[idx][i +3] - pixels[emojiIdx][i +3]) +
                        Math.abs(segments[idx][i +3] - pixels[emojiIdx][i +3]) +

                        Math.abs(segments[idx][i +4] - pixels[emojiIdx][i +4]) +
                        Math.abs(segments[idx][i +5] - pixels[emojiIdx][i +5]) +
                        Math.abs(segments[idx][i +6] - pixels[emojiIdx][i +6]) +
                        Math.abs(segments[idx][i +7] - pixels[emojiIdx][i +7]) +
                        Math.abs(segments[idx][i +7] - pixels[emojiIdx][i +7]) +
                        Math.abs(segments[idx][i +7] - pixels[emojiIdx][i +7]);
                }
            }
            if (emojiIdx >= pixels.length) emojiIdx = 0;
        }
        process.send({ status: idx / segments.length });
    }, 2010);
})