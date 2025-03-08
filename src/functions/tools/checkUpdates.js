const axios = require('axios');

module.exports = async function checkUpdates() {
    try {
        const response = await axios.get('https://api.github.com/repos/bartolumiu/dexchan_rework/releases/latest');
        const latestVersion = response.data.tag_name;
        const currentVersion = require('../../../package.json').version;

        const latest = {
            version: latestVersion,
            parts: latestVersion.split('.'),
            major: parseVersionPart(latestVersion.split('.')[0]),
            minor: parseVersionPart(latestVersion.split('.')[1]),
            patch: parseVersionPart(latestVersion.split('.')[2]),
            preRelease: latestVersion.split('-')[1] || ''
        };

        const current = {
            version: currentVersion,
            parts: currentVersion.split('.'),
            major: parseVersionPart(currentVersion.split('.')[0]),
            minor: parseVersionPart(currentVersion.split('.')[1]),
            patch: parseVersionPart(currentVersion.split('.')[2]),
            preRelease: currentVersion.split('-')[1] || ''
        };

        // Compare major, minor, and patch versions first
        const compareVersions = (latest, current) => {
            if (latest.major > current.major) return 1;
            if (latest.major < current.major) return -1;
            if (latest.minor > current.minor) return 1;
            if (latest.minor < current.minor) return -1;
            if (latest.patch > current.patch) return 1;
            if (latest.patch < current.patch) return -1;
            return 0;
        };

        const versionComparison = compareVersions(latest, current);

        // If the latest version is higher (stable > pre-release)
        if (versionComparison > 0) {
            return { isOutdated: true, latestVersion: latestVersion };
        }

        // Handle pre-release versions comparison (stable > dev > beta)
        if (versionComparison === 0) {
            // If the latest version is a stable release and the current version is pre-release
            if (!latest.preRelease && current.preRelease) {
                return { isOutdated: true, latestVersion: latestVersion };
            }

            // dev > beta comparison
            if (latest.preRelease === 'dev' && current.preRelease === 'beta') {
                return { isOutdated: true, latestVersion: latestVersion };
            }
        }

        // The current version is up-to-date
        return { isOutdated: false, latestVersion: latestVersion };
    } catch (e) {
        console.error('[GitHub] Failed to check for updates:', e.message);
        return { isOutdated: null, latestVersion: null };
    }
};

const parseVersionPart = (part) => isNaN(parseInt(part)) ? 0 : parseInt(part);
module.exports.parseVersionPart = parseVersionPart;