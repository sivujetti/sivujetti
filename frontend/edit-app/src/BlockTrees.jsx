import {__, http, signals, api} from '@sivujetti-commons-for-edit-app';
import toasters from './commons/Toaster.jsx';
import {treeToTransferable} from './Block/utils.js';
import BlockTree from './BlockTree.jsx';
import store, {selectCurrentPageDataBundle} from './store.js';

class BlockTrees extends preact.Component {
    /**
     * @param {{containingView: 'CreatePage'|'CreatePageType'|'Default';}} props
     */
    constructor(props) {
        super(props);
        this.state = {};
        this.signalListeners = [
        /**
         * @param {RawBlock} block
         */
        signals.on('on-block-tree-block-cloned', block => {
            api.webPageIframe.scrollTo(block, true);
        }),
        /**
         * @param {RawBlock} block
         */
        signals.on('on-block-tree-item-clicked', block => {
            api.webPageIframe.scrollTo(block);
        }),
        /**
         * @param {RawBlock} visibleBlock
         */
        signals.on('on-web-page-block-clicked', visibleBlock => {
            api.mainPanel.scrollTo(visibleBlock, false);
        })];
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.signalListeners.forEach(unreg => unreg());
    }
    /**
     * @access protected
     */
    render({containingView}) {
        return <BlockTree
            BlockTrees={ BlockTrees }
            disablePageInfo={ containingView === 'CreatePageType' }
            containingView={ containingView }/>;
    }
    /**
     * @param {Array<RawBlock>} newBlockTree
     * @param {String} trid
     * @returns {Promise<Boolean>}
     * @access public
     */
    static saveExistingBlocksToBackend(newBlockTree, trid) {
        let url = '';
        if (trid === 'main') {
            const {page} = selectCurrentPageDataBundle(store.getState());
            url = `/api/pages/${page.type}/${page.id}/blocks`;
        } else
            url = `/api/global-block-trees/${trid}/blocks`;
        return http.put(url, {blocks: treeToTransferable(newBlockTree)})
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                return true;
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
                return false;
            });
    }
}

export default BlockTrees;
