function createImage(url) {
    const img = new Image();
    img.src = url;
    return img;
}

function calculateSpeed(bytes, time) {
    const speedInMbps = (bytes * 8) / (time * 1000000);
    return speedInMbps.toFixed(2);
}

function formatResults(speed, type) {
    return `${type} Speed: ${speed} Mbps`;
}

export { createImage, calculateSpeed, formatResults };