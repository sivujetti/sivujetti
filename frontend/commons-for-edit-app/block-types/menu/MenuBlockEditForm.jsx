import {env} from '@sivujetti-commons-for-web-pages';
import CrudList from '../../CrudList.jsx';
import {__, api} from '../../edit-app-singletons.js';
import {Icon} from '../../Icon.jsx';
import {objectUtils} from '../../utils.js';
import EditItemPanel from './EditItemPanel.jsx';
/** @typedef {import('./EditItemPanel.jsx').MenuLink} MenuLink */

class MenuBlockEditForm extends preact.Component {
    // crudListRef;
    // linkCreator; // public
    // currentBlockIdInfo;
    // currentCtxMenuController; // public
    /**
     * @param {string} linkId
     * @param {keyof MenuLink} propToChange
     * @param {MenuLink[keyof MenuLink]} newVal
     * @param {boolean} doThrottleEmit = false
     * @access public
     */
    updateSubLinkAndEmitChanges(linkId, propToChange, newVal, doThrottleEmit = false) {
        const copy = objectUtils.cloneDeep(this.state.parsedTree);
        const ref = copy.find(({id}) => id === linkId);
        ref[propToChange] = newVal; // mutates $copy
        this.emitNewTree(copy, doThrottleEmit);
    }
    /**
     * @param {string} idOfLinkToDuplicate
     * @param {Array<MenuLink>} tree = this.state.parsedTree
     * @returns {Array<MenuLink>}
     * @access public
     */
    createNewBranchWithLinkDuplicated(idOfLinkToDuplicate, tree = this.state.parsedTree) {
        const clonedTree = objectUtils.cloneDeep(tree);
        const pos = clonedTree.findIndex(({id}) => id === idOfLinkToDuplicate);
        const orig = clonedTree[pos];
        const cmap = branch => branch.map(({slug, text, children}) =>
            this.linkCreator.makeLinkItem({
                slug,
                text,
                children: children.length ? cmap(children.length) : [],
            }))
        ;
        const duplicate = this.linkCreator.makeLinkItem({slug: orig.slug, text: orig.text,
            children: cmap(orig.children), includeToggleButton: orig.includeToggleButton});
        clonedTree.splice(pos + 1, 0, duplicate);
        return clonedTree;
    }
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
                getTitle={ item => !item.children.length ? item.text : [item.text, <Icon iconId="selector" className="size-xs ml-2 color-dimmed color-saturated2 p-absolute"/>] }
                onCreateCtxMenuCtrl={ this.createCtxMenuCtrl.bind(this) }
                onListMutated={ (newParsedTree, prop) => {
                    this.emitNewTree(newParsedTree, prop === 'text');
                } }
                createNewItem={ () =>
                    this.linkCreator.makeLinkItem()
                }
                editForm={ EditItemPanel }
                editFormProps={ {menuForm: this} }
                itemTypeFriendlyName={ __('link') }
                ref={ this.crudListRef }/>
        </div>;
    }
    /**
     * @param {ContextMenuController} ctrl
     * @returns {ContextMenuController}
     * @access private
     */
    createCtxMenuCtrl(ctrl) {
        const origGetLinks = ctrl.getLinks;
        const origOnClicked = ctrl.onItemClicked;
        this.currentCtxMenuController = {
            ...ctrl,
            getLinks: () => {
                const links = origGetLinks.call(ctrl);
                return [
                    links[0],
                    {text: __('Duplicate'), title: __('Duplicate'), id: 'duplicate'},
                    links[1],
                ];
            },
            onItemClicked: (link) => {
                if (link.id === 'duplicate') {
                    const newTree = this.createNewBranchWithLinkDuplicated(this.crudListRef.current.itemWithNavOpened.id);
                    this.emitNewTree(newTree);
                } else {
                    origOnClicked.call(ctrl, link);
                }
            },
        };
        return this.currentCtxMenuController;
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
     * @param {PartialMenuLink} vals = {slug: '/', text: __('Link text')}
     * @returns {MenuLink}
     * @access public
     */
    makeLinkItem(vals = {slug: '/', text: __('Link text')}) {
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
