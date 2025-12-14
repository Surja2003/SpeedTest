function measureDownloadSpeed() {
    return new Promise((resolve) => {
        const imageUrl = 'https://example.com/test-image.jpg'; // Replace with a valid image URL
        const startTime = Date.now();
        const img = new Image();

        img.onload = () => {
            const duration = (Date.now() - startTime) / 1000; // seconds
            const fileSize = 5000000; // 5MB in bytes (example size)
            const speed = (fileSize / duration) * 8 / 1024; // speed in Mbps
            resolve(speed);
        };

        img.src = imageUrl + '?cache=' + Math.random(); // Prevent caching
    });
}

function measureUploadSpeed() {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const xhr = new XMLHttpRequest();
        const data = new Blob(new Array(5000000)); // 5MB of data

        xhr.open('POST', 'https://example.com/upload', true); // Replace with a valid upload URL
        xhr.onload = () => {
            const duration = (Date.now() - startTime) / 1000; // seconds
            const speed = (data.size / duration) * 8 / 1024; // speed in Mbps
            resolve(speed);
        };

        xhr.send(data);
    });
}

function measurePing() {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const img = new Image();

        img.onload = () => {
            const duration = Date.now() - startTime; // milliseconds
            resolve(duration);
        };

        img.src = 'https://example.com/ping-test.jpg?' + Math.random(); // Replace with a valid URL
    });
}

function measureStability() {
    const results = [];
    const testCount = 5;

    return new Promise((resolve) => {
        const testPing = () => {
            measurePing().then((ping) => {
                results.push(ping);
                if (results.length < testCount) {
                    testPing();
                } else {
                    const average = results.reduce((a, b) => a + b) / results.length;
                    resolve(average);
                }
            });
        };

        testPing();
    });
}

export { measureDownloadSpeed, measureUploadSpeed, measurePing, measureStability };