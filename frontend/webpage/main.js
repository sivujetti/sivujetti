import EditAppAwareWebPage, {createTrier} from './src/EditAppAwareWebPage.js';

const singleWaitMillis = 200;
const maxTries = 10;
const waitForEditAppAndInformWeJustLoaded = createTrier(() => {
    const editApp = (window.parent || {}).editApp;
    // edit-app/main.js is not ready yet, wait $singleWaitMillis
    if (!editApp)
        return false;
    // edit-app/main.js is ready, stop calling this function
    const webPage = new EditAppAwareWebPage(window.sivujettiCurrentPageData || {});
    editApp.handleWebPageLoaded(webPage);
    return true;
}, singleWaitMillis, maxTries, 'Edit app did not appear after %sms');

waitForEditAppAndInformWeJustLoaded();
