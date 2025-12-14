import { measureDownloadSpeed, measureUploadSpeed, measurePing, measureStability } from '../scripts/speedTest';

describe('Speed Test Functions', () => {
    test('should measure download speed', async () => {
        const result = await measureDownloadSpeed();
        expect(result).toBeGreaterThan(0);
    });

    test('should measure upload speed', async () => {
        const result = await measureUploadSpeed();
        expect(result).toBeGreaterThan(0);
    });

    test('should measure ping', async () => {
        const result = await measurePing();
        expect(result).toBeGreaterThan(0);
    });

    test('should measure stability', async () => {
        const result = await measureStability();
        expect(result).toBeDefined();
    });
});