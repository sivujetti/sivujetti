import {__, http} from '@sivujetti-commons';
import Icon from '../../commons/Icon.jsx';
import toasters from '../../commons/Toaster.jsx';
import BlockTree from './BlockTree.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import store, {observeStore, selectCurrentPage} from './store.js';

class BlockTrees extends preact.Component {
    // blockTree;
    // doCleanStoreSubs;
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
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.doCleanStoreSubs();
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
                    : null }
                BlockTrees={ BlockTrees }
                ref={ this.blockTree }/>
        </div>;
    }
    /**
     * @param {Array<Block>} newBlockTree
     * @param {'page'|'layout'} blockGroup
     * @returns {Promise<Boolean>}
     * @access private
     */
    static saveExistingBlocksToBackend(newBlockTree, blockGroup) {
        const page = BlockTrees.currentWebPage.data.page;
        const url = blockGroup === 'page'
            ? `/api/pages/${page.type}/${page.id}/blocks`
            : `/api/layouts/${BlockTrees.currentWebPage.data.page.layoutId}/blocks`;
        const filtered = newBlockTree.filter(block => block.origin === blockGroup);
        return http.put(url,
            {blocks: blockTreeUtils.mapRecursively(filtered, block => block.toRaw())})
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
