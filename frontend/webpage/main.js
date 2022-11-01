import EditAppAwareWebPage from './src/EditAppAwareWebPage.js';

// see renderPlaceholderPage|renderNormalPage @edit-app/src/WebPageIframe.js
const {receiveNewPreviewIframePage} = (window.parent || {});

const webPage = new EditAppAwareWebPage(window.sivujettiCurrentPageData || {});
receiveNewPreviewIframePage(webPage);
