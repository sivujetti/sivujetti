import {api, env, http} from '@sivujetti-commons-for-edit-app';

/**
 * @returns {Promise<ReusableBranch[]>}
 */
function fetchOrGet() {
    return new Promise(resolve => {
        const saveButton = api.saveButton.getInstance();
        api.webPagePreview.onReady(() => {
            const fromStore = saveButton.getChannelState('reusableBranches');
            if (Array.isArray(fromStore)) {
                resolve(fromStore);
                return;
            }
            http.get('/api/reusable-branches')
                .then(reusables => {
                    reusables.reverse();
                    saveButton.initChannel('reusableBranches', reusables);
                    resolve(saveButton.getChannelState('reusableBranches'));
                })
                .catch(env.window.console.error);
        });
    });
}

export {fetchOrGet};
