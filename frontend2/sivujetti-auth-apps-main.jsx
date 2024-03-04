import {translator} from '@sivujetti-commons-for-edit-app';
import LoginApp from './auth-apps/LoginApp.jsx';

/**
 * Renders $appName to document.getElementById(`${appName}-app`).
 *
 * @param {'login'} appName
 * @param {String} dashboardUrl
 * @throws {Error} If $appName is not 'login'
 */
export default (appName, dashboardUrl) => {
    let App = null;
    if (appName === 'login') App = LoginApp;
    else throw new Error(`Expected appName (${appName}) to be 'login'.`);
    //
    window.translationStringBundles.forEach(strings => {
        translator.addStrings(strings);
    });
    //
    preact.render(
        <App dashboardUrl={ dashboardUrl }/>,
        document.getElementById(`${appName}-app`)
    );
};
