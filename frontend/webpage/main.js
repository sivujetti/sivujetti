import EditAppAwareWebPage from './src/EditAppAwareWebPage.js';

const webpage = new EditAppAwareWebPage();
webpage.doLoad((window.parent || {}).kuuraEditApp, window.kuuraCurrentPageData);
