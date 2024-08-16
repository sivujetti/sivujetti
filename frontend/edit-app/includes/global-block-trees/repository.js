import {api, env, http} from '@sivujetti-commons-for-edit-app';
import {treeToTransferable} from '../block/utils.js';

/**
 * @returns {Promise<GlobalBlockTree[]>}
 */
function fetchOrGet() {
    return new Promise(resolve => {
        const saveButton = api.saveButton.getInstance();
        api.webPagePreview.onReady(() => {
            const fromStore = saveButton.getChannelState('globalBlockTrees');
            if (Array.isArray(fromStore)) {
                resolve(fromStore);
                return;
            }
            http.get('/api/global-block-trees')
                .then(gbts => {
                    saveButton.initChannel('globalBlockTrees', gbts.map(gbt => ({
                        ...gbt,
                        ...{blocks: treeToTransferable(gbt.blocks)},
                    })));
                    resolve(saveButton.getChannelState('globalBlockTrees'));
                })
                .catch(env.window.console.error);
        });
    });
}

export {fetchOrGet};
