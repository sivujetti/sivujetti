import {__, http, signals} from '@sivujetti-commons';
import Icon from '../../commons/Icon.jsx';
import toasters from '../../commons/Toaster.jsx';
import BlockTree from './BlockTree.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import store, {observeStore, selectCurrentPage} from './store.js';

class BlockTrees extends preact.Component {
    // blockTree;
    // doCleanStoreSubs;
    // unregisterSignalListener;
    // static currentWebPage;
    // static currentWebPageBlockRefs;
    /**
     * @param {{containingView: String; onWebPageLoadHandled?: () => void;}} props
     */
    constructor(props) {
        super(props);
        this.state = {blocksInput: null};
        this.blockTree = preact.createRef();
        this.doCleanStoreSubs = observeStore(s => selectCurrentPage(s), value => {
            const dataFromWebPage = value.webPage.data;
            if (// `this` is still attached to <DefaultMainPanelView/>, but placeholder page is loaded
                (this.props.containingView === 'DefaultMainPanelView' && dataFromWebPage.page.isPlaceholderPage) ||
                // `this` is still attached to <AddPageMainPanelViwe/>, but reqular page is loaded
                (this.props.containingView === 'AddPageMainPanelView' && !dataFromWebPage.page.isPlaceholderPage))
                return;
            this.handleWebPageDataReceived(value);
        });
    }
    /**
     * @returns {Array<Block>}
     * @access public
     */
    getPageBlocks() {
        return this.blockTree.current.getTree().filter(block => block.origin === 'page');
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const value = selectCurrentPage(store.getState());
        if (value.dataFromWebPage) {
            this.handleWebPageDataReceived(value);
        }
        this.unregisterSignalListener = signals.on('on-web-page-block-clicked',
        /**
         * @param {BlockRefComment} blockRef
         */
        blockRef => {
            const treeCmp = this.blockTree.current;
            const b = blockTreeUtils.findRecursively(treeCmp.getTree(), b => b._cref === blockRef);
            treeCmp.handleItemClicked(b);
        });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.doCleanStoreSubs();
        this.unregisterSignalListener();
    }
    /**
     * @param {{webPage: EditAppAwareWebPage; combinedBlockTree: Array<RawBlock>; blockRefs: Array<BlockRefComment>;}} d
     * @access private
     */
    handleWebPageDataReceived(d) {
        BlockTrees.currentWebPage = d.webPage;
        BlockTrees.currentWebPageBlockRefs = d.blockRefs;
        this.setState({blocksInput: d.combinedBlockTree});
        this.props.onWebPageLoadHandled && this.props.onWebPageLoadHandled();
    }
    /**
     * @access protected
     */
    render({containingView}, {blocksInput}) {
        if (blocksInput === null)
            return;
        return <div>
            <button
                onClick={ () => this.blockTree.current.appendNewBlockPlaceholder() }
                class="btn btn-sm with-icon my-2"
                title={ __('Add new block') } type="button">
                <Icon iconId="plus" className="size-sm"/> { __('Add block') }
            </button>
            <BlockTree
                blocksInput={ blocksInput }
                onChangesApplied={ containingView === 'DefaultMainPanelView'
                    ? BlockTrees.saveExistingBlocksToBackend
                    : function () {} }
                BlockTrees={ BlockTrees }
                ref={ this.blockTree }/>
        </div>;
    }
    /**
     * @param {Array<Block>} newBlockTree
     * @returns {Promise<Boolean>}
     * @access private
     */
    static saveExistingBlocksToBackend(newBlockTree) {
        const page = BlockTrees.currentWebPage.data.page;
        // todo a, b
        const url = 'pageBlocks'
            ? `/api/pages/${page.type}/${page.id}/blocks`
            : `/api/layouts/${BlockTrees.currentWebPage.data.page.layoutId}/blocks`;
        return http.put(url,
            {blocks: blockTreeUtils.mapRecursively(newBlockTree, block => block.toRaw())})
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                return true;
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'));
                return false;
            });
    }
}

export default BlockTrees;
