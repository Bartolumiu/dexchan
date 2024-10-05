const axios = require('axios');

module.exports = async function checkUpdates() {
    try {
        const response = await axios.get('https://api.github.com/repos/bartolumiu/dexchan_rework/releases/latest');
        const latestVersion = response.data.tag_name;
        const currentVersion = require('../../../package.json').version;

        // Version string format: 1.0.0, 1.0.0-dev or 1.0.0-beta
        const latest = {
            version: latestVersion,
            parts: latestVersion.split('.'),
            major: parseInt(latestVersion.split('.')[0]),
            minor: parseInt(latestVersion.split('.')[1]),
            patch: parseInt(latestVersion.split('.')[2]),
            preRelease: latestVersion.split('-')[1] || null
        };

        const current = {
            version: currentVersion,
            parts: currentVersion.split('.'),
            major: parseInt(currentVersion.split('.')[0]),
            minor: parseInt(currentVersion.split('.')[1]),
            patch: parseInt(currentVersion.split('.')[2]),
            preRelease: currentVersion.split('-')[1] || null
        };

        // Check the major, minor, and patch versions
        if (latest.major > current.major ||
            latest.major === current.major && latest.minor > current.minor ||
            latest.major === current.major && latest.minor === current.minor && latest.patch > current.patch) {
            return { isOutdated: true, latestVersion: latestVersion };
        }

        // Check the pre-release versions
        // Order of precedence: dev > beta
        if (!latest.preRelease && current.preRelease) return { isOutdated: true, latestVersion: latestVersion };
        if (latest.preRelease === 'dev' && current.preRelease === 'beta') return { isOutdated: true, latestVersion: latestVersion };

        // The current version is up-to-date
        return { isOutdated: false, latestVersion: latestVersion };
    } catch (e) {
        console.error('[GitHub] Failed to check for updates:', e.message);
        return { isOutdated: null, latestVersion: null };
    }
}