const {exec} = require('child_process');
const path = require('path');
const {config} = require('../config.js');
const e2eUtilsAppFilePath = path.join(__dirname, 'cli.php');

exports.env = {
    baseUrl: config.baseUrl,
    /**
     * @param {String} url e.g. '/foo', 'foo'
     * @return {String} 'http://localhost/sivujetti/index.php?q=/foo'
     */
    makeUrl(url) {
        return config.baseUrl + (url.startsWith('/') ? url : `/${url}`);
    },
    /**
     * @param {String} urlToRedirectAfter e.g. 'http://localhost/sivujetti/index.php?q=/_edit'
     */
    makeAutoLoginUrl(urlToRedirectAfter) {
        return config.baseUrl.replace('/index.php?q=', '/e2e-tests/utils/autologin.php?urlToRedirectAfter=' + encodeURIComponent(urlToRedirectAfter));
    },
    useReduxBlockTree: true,
};

exports.envUtils = {
    /**
     * @param {String} dataBundleName e.g. 'minimal' or 'minimal+page-categories' or 'with-listing-block+another-page-type'
     * @returns {Promise<Object>}
     */
    setupTestSite(dataBundleName) {
        return runCmd('e2e-mode', 'begin', dataBundleName);
    },
    /**
     * @returns {Promise<Object>}
     */
    destroyTestSite() {
        return runCmd('e2e-mode', 'end');
    }
};

/**
 * @param {String} commandName
 * @returns {Promise<Object>}
 */
function runCmd(commandName, ...args) {
    return new Promise(resolve => {
        const argsStr = args.length ? ` ${args.join(' ')}` : '';
        exec(`php ${e2eUtilsAppFilePath} ${commandName}${argsStr}`, (error, stdout, stderr) => {
            if (error) throw new Error(error);
            if (stderr) console.log(`stderr: ${stderr}`);
            resolve(JSON.parse(stdout));
        });
    });
}

exports.runCommand = runCmd;
