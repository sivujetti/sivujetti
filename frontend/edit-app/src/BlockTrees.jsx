import {__, http, signals} from '@sivujetti-commons';
import Icon from '../../commons/Icon.jsx';
import Tabs from '../../commons/Tabs.jsx';
import toasters from '../../commons/Toaster.jsx';
import BlockTree from './BlockTree.jsx';
import blockTreeUtils from './blockTreeUtils.js';
import store, {observeStore, selectCurrentPage} from './store.js';

class BlockTreeTabs extends preact.Component {
    // pageBlocksTree;
    // layoutBlocksTree;
    // tabs;
    // doCleanStoreSubs;
    // doCleanSignalListeners;
    // static currentWebPage;
    // static currentWebPageComments;
    /**
     * @param {{containingView: String; onWebPageLoadHandled?: () => void;}} props
     */
    constructor(props) {
        super(props);
        this.state = {currentTabIdx: 0, pageBlocksInput: null, layoutBlocksInput: null};
        this.pageBlocksTree = preact.createRef();
        this.layoutBlocksTree = preact.createRef();
        this.tabs = preact.createRef();
        this.doCleanStoreSubs = observeStore(s => selectCurrentPage(s), value => {
            if (// `this` is still attached to <DefaultMainPanelView/>, but placeholder page is loaded
                (this.props.containingView === 'DefaultMainPanelView' && value.dataFromWebPage.page.isPlaceholderPage) ||
                // `this` is still attached to <AddPageMainPanelViwe/>, but reqular page is loaded
                (this.props.containingView === 'AddPageMainPanelView' && !value.dataFromWebPage.page.isPlaceholderPage))
                return;
            this.handleWebPageDataReceived(value);
        });
    }
    /**
     * @returns {Array<Block>}
     * @access public
     */
    getPageBlocksTree() {
        return this.pageBlocksTree.current.getTree();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const value = selectCurrentPage(store.getState());
        if (value.dataFromWebPage) {
            this.handleWebPageDataReceived(value);
        }
        //
        const treeCmps = [this.pageBlocksTree, this.layoutBlocksTree];
        const setBlockAsSelected = (blockRef, selectedTabIdx = this.state.currentTabIdx, nthAttemp = 0) => {
            const selectedTreeCmp = treeCmps[selectedTabIdx].current;
            const b = blockTreeUtils.findRecursively(selectedTreeCmp.getTree(), b => b._cref === blockRef);
            if (b) {
                selectedTreeCmp.handleItemClicked(b);
            } else { // Select the another tree & recurse
                if (nthAttemp > 0) return;
                const nextTabIdx = this.state.currentTabIdx === 0 ? 1 : 0;
                this.tabs.current.changeTab(nextTabIdx);
                setTimeout(() => {
                    setBlockAsSelected(blockRef, nextTabIdx, 1);
                }, 0);
            }
        };
        this.doCleanSignalListeners = signals.on('on-web-page-block-clicked', setBlockAsSelected);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.doCleanStoreSubs();
        this.doCleanSignalListeners();
    }
    /**
     * @param {{dataFromWebPage: CurrentPageData; comments: Array<BlockRefComment>; webPage: EditAppAwareWebPage;}} d
     * @access private
     */
    handleWebPageDataReceived(d) {
        BlockTreeTabs.currentWebPage = d.webPage;
        BlockTreeTabs.currentWebPageComments = d.comments;
        this.setState({pageBlocksInput: d.dataFromWebPage.page.blocks,
                       layoutBlocksInput: d.dataFromWebPage.layoutBlocks});
        this.props.onWebPageLoadHandled && this.props.onWebPageLoadHandled();
    }
    /**
     * @access protected
     */
    render({hideTabs, containingView}, {currentTabIdx, pageBlocksInput, layoutBlocksInput}) {
        if (pageBlocksInput === null)
            return;
        return <div>
            { !hideTabs ? <Tabs className="tab-block" links={ [__('Page'), __('Layout')] }
                onTabChanged={ toIdx => this.setState({currentTabIdx: toIdx}) } ref={ this.tabs }/> : null }
            { currentTabIdx === 0
                ? [
                    <button
                        onClick={ () => this.pageBlocksTree.current.appendNewBlockPlaceholder() }
                        class="btn btn-sm with-icon mt-2"
                        title={ __('Add new block') } type="button">
                        <Icon iconId="plus" className="size-sm"/> { __('Add block') }
                    </button>,
                    <BlockTree
                        treeKind="pageBlocks"
                        blocksInput={ pageBlocksInput }
                        onChangesApplied={ containingView === 'DefaultMainPanelView'
                            ? BlockTreeTabs.saveExistingPageBlocksToBackend
                            : function () {} }
                        BlockTrees={ BlockTreeTabs }
                        ref={ this.pageBlocksTree }/>,
                ]
                : <BlockTree
                    treeKind="layoutBlocks"
                    blocksInput={ layoutBlocksInput }
                    onChangesApplied={ () => null }
                    BlockTrees={ BlockTreeTabs }
                    ref={ this.layoutBlocksTree }/>
            }
        </div>;
    }
    /**
     * @param {Array<Block>} newBlockTree
     * @param {'pageBlocks'|'layoutBlocks'} blockTreeKind
     * @returns {Promise<Boolean>}
     * @access private
     */
    static saveExistingPageBlocksToBackend(newBlockTree, blockTreeKind) {
        const page = BlockTreeTabs.currentWebPage.data.page;
        const url = blockTreeKind === 'pageBlocks'
            ? `/api/pages/${page.type}/${page.id}/blocks`
            : `/api/layouts/${BlockTreeTabs.currentWebPage.data.page.layoutId}/blocks`;
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

export default BlockTreeTabs;
