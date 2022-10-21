import EditAppAwareWebPage, {createTrier} from './src/EditAppAwareWebPage.js';

const singleWaitMillis = 200;
const maxTries = 10;
const waitForEditAppAndInformWeJustLoaded = createTrier(() => {
    // see foo|foo2 @edit-app/src/WebPageIframe.js
    const {receiveNewPreviewIframePage} = (window.parent || {});
    // edit-app/main.js is not ready yet, wait $singleWaitMillis
    if (typeof receiveNewPreviewIframePage !== 'function')
        return false;
    // edit-app/main.js is ready, stop calling this function
    const webPage = new EditAppAwareWebPage(window.sivujettiCurrentPageData || {});
    receiveNewPreviewIframePage(webPage);
    return true;
}, singleWaitMillis, maxTries, 'Edit app did not appear after %sms');

waitForEditAppAndInformWeJustLoaded();
