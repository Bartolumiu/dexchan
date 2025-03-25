/**
 * Retrieves the current version of the application from the package.json file.
 *
 * @returns {string} The current version number.
 */
const getVersion = () => {
    return require('../../../package.json').version;
};
module.exports = getVersion;