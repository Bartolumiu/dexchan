const https = require('https');
const { getPing } = require('../../../src/commands/utils/ping');

jest.mock('https');

test('should receive with ping time on success', async () => {
    https.get.mockImplementation((url, options, callback) => {
        const res = {
            on: (event, handler) => {
                if (event === 'end') handler();
            }
        };
        callback(res);
        return { on: jest.fn() };
    });

    const pingTime = await getPing('https://example.com');
    expect(pingTime).toBeGreaterThanOrEqual(0);
});

test('should reject with an error on failure', async () => {
    https.get.mockImplementation((url, options, callback) => {
        return {
            on: (event, handler) => {
                if (event === 'error') handler(new Error('Error'));
            }
        };
    });

    await expect(getPing('https://example.com')).rejects.toThrow('Error');
});