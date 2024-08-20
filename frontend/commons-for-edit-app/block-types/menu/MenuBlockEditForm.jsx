import {env} from '@sivujetti-commons-for-web-pages';
import CrudList from '../../CrudList.jsx';
import {__, api} from '../../edit-app-singletons.js';
import EditItemPanel from './EditItemPanel.jsx';
import {objectUtils} from '../../utils.js';
/** @typedef {import('./EditItemPanel.jsx').MenuLink} MenuLink */

class MenuBlockEditForm extends preact.Component {
    // crudListRef;
    // linkCreator;
    // currentBlockIdInfo;
    /**
     * @access protected
     */
    componentDidMount() {
        this.crudListRef = preact.createRef();
        this.linkCreator = new CountingLinkItemFactory();
        const {block} = this.props;
        const pageSlug = api.saveButton.getInstance().getChannelState('currentPageData').slug;
        const trid = 'main'; // getIsStoredToTreeIdFrom(block.id, 'mainTree');
        this.currentBlockIdInfo = `${block.id}:${trid}:${pageSlug}`;
        this.setState({parsedTree: this.linkCreator.setGetCounterUsingTreeOf(block)});
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.block !== this.props.block &&
            JSON.stringify(this.props.block.tree) !== JSON.stringify(props.block.tree)) {
            const newState = {parsedTree: this.linkCreator.setGetCounterUsingTreeOf(props.block)};
            this.setState(newState);
        }
    }
    /**
     * @access protected
     */
    render(_, {parsedTree}) {
        if (!parsedTree) return;
        return <div style="margin-top: -.2rem;">
            <CrudList
                items={ parsedTree }
                itemTitleKey="text"
                onCreateCtxMenuCtrl={ this.createCtxMenuCtrl.bind(this) }
                onListMutated={ (newParsedTree, prop) => {
                    this.emitNewTree(newParsedTree, prop === 'text');
                } }
                createNewItem={ () =>
                    this.linkCreator.makeLinkItem({slug: '/', text: __('Link text')})
                }
                editForm={ EditItemPanel }
                editFormProps={ {} }
                itemTypeFriendlyName={ __('link') }
                ref={ this.crudListRef }/>
        </div>;
    }
    /**
     * @param {ContextMenuController} ctrl
     * @returns {ContextMenuController}
     */
    createCtxMenuCtrl(ctrl) {
        const origGetLinks = ctrl.getLinks;
        const origOnClicked = ctrl.onItemClicked;
        return {
            ...ctrl,
            getLinks: () => {
                const links = origGetLinks.call(ctrl);
                return [
                    links[0],
                    {text: __('Duplicate'), title: __('Duplicate'), id: 'duplicate'},
                    links[1],
                ];
            },
            onItemClicked: link => {
                if (link.id === 'duplicate') {
                    const linkWithNavOpened = this.crudListRef.current.itemWithNavOpened;
                    const {parsedTree} = this.state;
                    const clonedTree = objectUtils.cloneDeep(parsedTree);
                    const pos = clonedTree.findIndex(({id}) => id === linkWithNavOpened.id);
                    const orig = clonedTree[pos];
                    const duplicate = this.linkCreator.makeLinkItem({slug: orig.slug, text: orig.text});
                    clonedTree.splice(pos + 1, 0, duplicate);
                    this.emitNewTree(clonedTree);
                } else {
                    origOnClicked.call(ctrl, link);
                }
            },
        };
    }
    /**
     * @param {Array<MenuLink>} newParsedTree
     * @param {Boolean} doThrottle = false
     * @access private
     */
    emitNewTree(newParsedTree, doThrottle = false) {
        if (!doThrottle)
            this.props.emitValueChanged(newParsedTree, 'tree');
        else
            this.props.emitValueChangedThrottled(newParsedTree, 'tree');
    }
    /**
     * @access private
     */
    navigateToPageCreate() {
        env.window.myRoute(`/pages/create?addToMenu=${this.currentBlockIdInfo}`);
    }
}

class CountingLinkItemFactory {
    // counter;
    /**
     */
    constructor() {
        this.counter = 0;
    }
    /**
     * @param {Block|BlockData} newTree
     * @returns {Array<MenuLink>}
     * @access public
     */
    setGetCounterUsingTreeOf(newTree) {
        const parsedTree = objectUtils.cloneDeep(newTree.tree);
        this.counter = getMaxId(parsedTree);
        return parsedTree;
    }
    /**
     * @param {PartialMenuLink} vals
     * @returns {MenuLink}
     * @access public
     */
    makeLinkItem(vals) {
        return {
            ...vals,
            ...(!Object.prototype.hasOwnProperty.call(vals, 'id')
                ? {id: (++this.counter).toString()}
                : {}),
            ...(!Object.prototype.hasOwnProperty.call(vals, 'children')
                ? {children: []}
                : {}),
        };
    }
}

/**
 * @param {Array<MenuLink} branch
 * @returns {number}
 */
function getMaxId(branch) {
    return branch.reduce((max, link) => {
        const asInt = parseInt(link.id, 10);
        const currentBranchMax = asInt > max ? asInt : max;
        const childBranchMax = !link.children.length ? 0 : getMaxId(link.children);
        return childBranchMax > currentBranchMax ? childBranchMax : currentBranchMax;
    }, 0);
}

export default MenuBlockEditForm;
export {CountingLinkItemFactory};
