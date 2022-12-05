import EditAppAwareWebPage from './src/EditAppAwareWebPage.js';

// see renderPlaceholderPage|renderNormalPage @edit-app/src/WebPageIframe.js
const {receiveNewPreviewIframePage} = (window.parent || {});

if (receiveNewPreviewIframePage) {
    const webPage = new EditAppAwareWebPage(window.sivujettiCurrentPageData || {});
    receiveNewPreviewIframePage(webPage);
}
