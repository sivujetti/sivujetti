import {api, env, http} from '../../../sivujetti-commons-unified.js';

/**
 * @returns {Promise<ReusableBranch[]>}
 */
function fetchOrGet() {
    return new Promise(resolve => {
        const saveButton = api.saveButton.getInstance();
        api.webPagePreview.onReady(() => {
            const fromStore = saveButton.getChannelState('reusableBranches');
            if (Array.isArray(fromStore))
                return Promise.resolve(fromStore);
            resolve(http.get('/api/reusable-branches')
                .then(reusables => {
                    reusables.reverse();
                    saveButton.initChannel('reusableBranches', reusables);
                    return saveButton.getChannelState('reusableBranches');
                })
                .catch(env.window.console.error));
        });
    });
}

export {fetchOrGet};
