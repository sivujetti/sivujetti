import EditAppAwareWebPage from './src/EditAppAwareWebPage.js';

const editApp = (window.parent || {}).editApp;

if (editApp) {
    const webPage = new EditAppAwareWebPage(window.kuuraCurrentPageData || {});
    editApp.handleWebPageLoaded(webPage);

    const host = location.hostname;
    // https://stackoverflow.com/a/2911045
    Array.from(document.querySelectorAll('a')).forEach(a => {
        if (a.hostname === host || !a.hostname.length)
            a.href += `${a.search[0] !== '?' ? '?' : '&'}in-edit`;
    });
}
