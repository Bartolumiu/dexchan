/**
 * Truncates a string to a specified maximum length, ensuring it does not cut off words.
 * If the string exceeds the maximum length, it will be truncated and appended with ' (...)'.
 * * @param {string} str The string to truncate
 * @param {number} [maxLength=100] The maximum length of the string, defaults to 100
 * @returns {string|null} The truncated string or null if input is invalid
*/

const truncateString = (str, maxLength = 100) => {
    if (str === null || str === undefined) return null;
    if (typeof str !== 'string') {
        throw new TypeError('Input must be a string');
    }
    if (str.length <= maxLength) {
        return str;
    } else if (maxLength <= 6) {
        throw new RangeError('Maximum length must be greater than 6');
    }
    
    return str.slice(0, maxLength - 6).split(' ').slice(0, -1).join(' ') + ' (...)';
}

module.exports = truncateString;