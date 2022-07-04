import {observeStore, selectCurrentPage} from '../../edit-app/src/store.js';
import * as appTestUtils from './edit-app-test-utils.js';

/**
 * @param {Boolean} isDrafPageType = false
 * @returns {Promise<void>}
 */
function simulatePlaceholderPageLoad(isDrafPageType = false) {
    // Wait for next "selectCurrentPage"
    const p = new Promise(resolve => {
        observeStore(selectCurrentPage, () => {
            resolve();
        });
    });
    // Simulate page load (which triggers "selectCurrentPage")
    appTestUtils.simulatePageLoad(null, true, ...(!isDrafPageType ? [] : [undefined, 'Draft']));
    return p;
}

/**
 * @param {any} _s
 * @returns {Promise<void>}
 */
function clickSubmitButton(_s) {
    const p = appTestUtils.waitUntiSaveButtonHasRunQueuedOps();
    setTimeout(() => {
        document.querySelector('#render-container-el button + button').click();
    }, 1);
    return p;
}

export {simulatePlaceholderPageLoad, clickSubmitButton};
