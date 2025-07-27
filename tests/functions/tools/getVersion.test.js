const getVersion = require('../../../src/functions/tools/getVersion.js');
const pkg = require('../../../package.json');

describe('getVersion', () => {
    test('should return the version defined in package.json', () => {
        expect(getVersion()).toBe(pkg.version);
    });
});