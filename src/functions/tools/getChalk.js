const getChalk = async () => {
    const chalkInstance = await import('chalk');
    return chalkInstance.default;
}

module.exports = getChalk;