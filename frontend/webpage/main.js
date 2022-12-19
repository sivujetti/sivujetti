import EditAppAwareWebPage from './src/EditAppAwareWebPage.js';

// see renderPlaceholderPage|renderNormalPage @edit-app/src/right-column/WebPageIframe.js
const {receiveNewPreviewIframePage, dataFromAdminBackend} = (window.parent || {});

if (receiveNewPreviewIframePage) {
    const pageData = window.sivujettiCurrentPageData || {};
    const webPage = new EditAppAwareWebPage(pageData, dataFromAdminBackend.baseUrl);
    receiveNewPreviewIframePage(webPage);
}
