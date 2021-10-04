import {markInternalLinksAsInternal} from '../shared.js';
import EditAppAwareWebPage from './src/EditAppAwareWebPage.js';

let tries = 0;

const informEditAppWeJustLoaded = () => {
    const editApp = (window.parent || {}).editApp;
    //
    if (editApp) {
        const webPage = new EditAppAwareWebPage(window.sivujettiCurrentPageData || {});
        editApp.handleWebPageLoaded(webPage);

        markInternalLinksAsInternal(document);
    // edit-app/main.js is not ready yet
    } else {
        if (++tries < 4)
            setTimeout(informEditAppWeJustLoaded, 200);
        else
            window.console.error(`Edit app did not appear after ${200*tries}ms`);
    }
};

informEditAppWeJustLoaded();
