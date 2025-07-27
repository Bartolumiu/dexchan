/**
 * Gets the Chalk instance for terminal styling.
 * @returns {Promise<import('chalk').Chalk>} A promise that resolves to the Chalk instance.
 */
const getChalk = async () => {
    const chalkInstance = await import('chalk');
    return chalkInstance.default;
}

module.exports = getChalk;