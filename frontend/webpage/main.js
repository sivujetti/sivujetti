import EditAppAwareWebPage from './src/EditAppAwareWebPage.js';

let tries = 0;

const informEditAppWeJustLoaded = () => {
    const editApp = (window.parent || {}).editApp;
    //
    if (editApp) {
        const webPage = new EditAppAwareWebPage(window.sivujettiCurrentPageData || {});
        editApp.handleWebPageLoaded(webPage);

        const host = location.hostname;
        // https://stackoverflow.com/a/2911045
        Array.from(document.querySelectorAll('a')).forEach(a => {
            if (a.hostname === host || !a.hostname.length)
                a.href += `${a.search[0] !== '?' ? '?' : '&'}in-edit`;
        });
    // edit-app/main.js is not ready yet
    } else {
        if (++tries < 4)
            setTimeout(informEditAppWeJustLoaded, 200);
        else
            window.console.error(`Edit app did not appear after ${200*tries}ms`);
    }
};

informEditAppWeJustLoaded();
