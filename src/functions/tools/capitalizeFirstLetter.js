/**
 * Capitalizes the first letter of the provided string.
 *
 * @param {string} str - The string to be transformed.
 * @returns {string} The resulting string with the first letter capitalized.
 * @throws {TypeError} If the input is not a string.
 */
const capitalizeFirstLetter = (str) => {
    if (typeof str !== 'string') {
        throw new TypeError('Expected a string');
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = capitalizeFirstLetter;