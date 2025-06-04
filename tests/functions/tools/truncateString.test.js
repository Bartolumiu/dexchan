const truncateString = require('../../../src/functions/tools/truncateString');

describe('truncateString', () => {
    it('defaults maxLength to 100 if not provided', () => {
        const str = 'a'.repeat(150);
        const result = truncateString(str);
        // Should truncate to 94 chars + ' (...)' (since 100-6=94, then split, slice(0,-1), join, but with no spaces, result is ' (...)')
        expect(result).toBe(' (...)');
    });
    it('returns the original string if shorter than maxLength', () => {
        expect(truncateString('short', 10)).toBe('short');
    });

    it('returns the original string if equal to maxLength', () => {
        expect(truncateString('1234567890', 10)).toBe('1234567890');
    });

    it('truncates and adds ellipsis if string is longer than maxLength', () => {
        const str = 'This is a long string that should be truncated.';
        // maxLength = 20, so slice(0, 14), split, slice(0, -1), join, add ' (...)'
        // 'This is a long st' -> ['This', 'is', 'a', 'long', 'st'] -> remove last -> ['This', 'is', 'a'] -> 'This is a (...)'
        expect(truncateString(str, 20)).toBe('This is a (...)');
    });

    it('throws if input is not a string', () => {
        expect(() => truncateString(123, 10)).toThrow(TypeError);
    });

    it('throws if maxLength is less than or equal to 6', () => {
        expect(() => truncateString('abcdefg', 6)).toThrow(RangeError);
        expect(() => truncateString('abcdefg', 0)).toThrow(RangeError);
    });

    it('handles strings with no spaces gracefully', () => {
        expect(truncateString('abcdefghijklmno', 10)).toBe(' (...)');
    });

    it('returns null if str is null', () => {
        expect(truncateString(null, 10)).toBeNull();
    });

    it('returns null if str is undefined', () => {
        expect(truncateString(undefined, 10)).toBeNull();
    });
});
