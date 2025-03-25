const capitalizeFirstLetter = require('../../../src/functions/tools/capitalizeFirstLetter');

describe('capitalizeFirstLetter', () => {
    test('should capitalize the first letter of a lowercase word', () => {
        expect(capitalizeFirstLetter('hello')).toBe('Hello');
    });

    test('should return an empty string when given an empty string', () => {
        expect(capitalizeFirstLetter('')).toBe('');
    });

    test('should not change the string if the first letter is already capitalized', () => {
        expect(capitalizeFirstLetter('Hello')).toBe('Hello');
    });

    test('should throw a TypeError when input is not a string', () => {
        expect(() => capitalizeFirstLetter(123)).toThrow(TypeError);
        expect(() => capitalizeFirstLetter(null)).toThrow(TypeError);
        expect(() => capitalizeFirstLetter(undefined)).toThrow(TypeError);
    });
});