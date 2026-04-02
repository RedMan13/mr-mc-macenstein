const { ipcRenderer } = require("electron");

let update;
ipcRenderer.on('play', (_, file, id, x,y, width, height, loop) => {
    if (update(id, x,y, width, height)) return;
    const box = document.getElementById('media-box');
    /** @type {HTMLVideoElement} */
    const video = document.createElement('video');
    video.autoplay = true;
    video.controls = false;
    video.onended = () => video.remove();
    video.classList.add('background');
    video.loop = loop;
    if (x) video.style.left = `${x}px`;
    if (y) video.style.top = `${y}px`;
    if (width) video.style.width = `${width}px`;
    if (height) video.style.height = `${height}px`;
    if (id) video.setAttribute('id', id);
    /** @type {HTMLSourceElement} */
    const source = document.createElement('source');
    source.src = file;
    console.log('loaded', file);
    video.appendChild(source);
    box.appendChild(video);
});
ipcRenderer.on('update', update = (_, id, playing, x,y, width, height) => {
    const video = document.getElementById(id);
    if (!video) return false;
    if (x) video.style.left = `${x}px`;
    if (y) video.style.top = `${y}px`;
    if (width) video.style.width = `${width}px`;
    if (height) video.style.height = `${height}px`;
    if (typeof playing !== 'undefined') {
        if (!playing) video.pause();
        else video.play();
    }
    return true;
})
ipcRenderer.on('cancel', (_, id) => {
    if (id) {
        const video = document.getElementById(id);
        video.remove();
        return;
    }
    const box = document.getElementById('media-box');
    box.innerHTML = '';
})