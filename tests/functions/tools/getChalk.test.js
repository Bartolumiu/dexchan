const getChalk = require('../../../src/functions/tools/getChalk');

describe('getChalk', () => {
    it('should import chalk and return the default export', async () => {
        const chalk = await getChalk();
        expect(chalk).toBeDefined();
        expect(typeof chalk).toBe('function');
    });
});