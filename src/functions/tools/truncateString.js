const truncateString = (str, maxLength = 100) => {
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