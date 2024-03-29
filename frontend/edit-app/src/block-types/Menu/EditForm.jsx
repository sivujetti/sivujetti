import {__, env, Icon} from '@sivujetti-commons-for-edit-app';
import {getIsStoredToTreeIdFrom} from '../../block/utils-utils.js';
import ContextMenu from '../../commons/ContextMenu.jsx';
import store, {selectCurrentPageDataBundle} from '../../store.js';
import EditItemPanel from './EditItemPanel.jsx';

class MenuBlockEditForm extends preact.Component {
    // linkCreator;
    // outerEl;
    // contextMenu;
    // currentBlockIdInfo;
    /**
     * @access protected
     */
    componentDidMount() {
        this.linkCreator = new CountingLinkItemFactory();
        this.outerEl = preact.createRef();
        this.contextMenu = preact.createRef();
        const {getBlockCopy, grabChanges} = this.props;
        const block = getBlockCopy();
        const pageSlug = selectCurrentPageDataBundle(store.getState()).page.slug;
        const trid = getIsStoredToTreeIdFrom(block.id, 'mainTree');
        this.currentBlockIdInfo = `${block.id}:${trid}:${pageSlug}`;
        this.setState({parsedTree: this.linkCreator.setGetCounterUsingTreeOf(block),
                       editPanelState: createEditPanelState(),
                       linkWithNavOpened: null});
        grabChanges((block, _origin, _isUndo) => {
            const newState = {parsedTree: this.linkCreator.setGetCounterUsingTreeOf(block)};
            const {link, leftClass, rightClass} = this.state.editPanelState;
            if (link) newState.editPanelState = createEditPanelState(
                findLinkItem(newState.parsedTree, link.id),
                leftClass,
                rightClass
            );
            this.setState(newState);
        });
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render(_, {parsedTree, editPanelState}) {
        if (!editPanelState) return;
        return <div class="anim-outer pt-1">
            <div class={ editPanelState.leftClass } ref={ this.outerEl }>
                <ul class="list">{ parsedTree.map((item, i) =>
                    <li class={ `ml-2${i > 0 ? '' : ' mt-0'}` } key={ item.id }><div class="d-flex flex-centered">
                        <span>{ item.text }</span>
                        <button onClick={ e => this.openMoreMenu(item, e) } class="btn btn-sm btn-link col-ml-auto flex-centered" type="button">
                            <Icon iconId="dots" className="size-sm"/>
                        </button>
                    </div></li>
                ) }</ul>
                <button onClick={ this.navigateToPageCreate.bind(this) }
                    class="btn btn-sm text-tiny with-icon-inline color-dimmed mt-2 mr-1" type="button">
                    <Icon iconId="plus" className="size-xs mr-1"/> { __('Create and add page') }
                </button>
                <button onClick={ this.appendItemToMenu.bind(this) }
                    class="btn btn-sm text-tiny with-icon-inline color-dimmed mt-2" type="button">
                    <Icon iconId="plus" className="size-xs mr-1"/> { __('Add link') }
                </button>
            </div>
            <ContextMenu
                links={ [
                    {text: __('Edit'), title: __('Edit link'), id: 'edit'},
                    {text: __('Delete'), title: __('Delete link'), id: 'delete'},
                ] }
                onItemClicked={ this.handleContextMenuLinkClicked.bind(this) }
                onMenuClosed={ () => this.setState({linkWithNavOpened: null}) }
                ref={ this.contextMenu }/>
            <EditItemPanel
                link={ editPanelState.link }
                cssClass={ editPanelState.rightClass }
                onLinkPropUpdated={ (value, prop) => {
                    const ref = findLinkItem(this.state.parsedTree, editPanelState.link.id);
                    ref[prop] = value; // Mutates this.state.parsedTree
                    this.applyAndEmit(this.state.parsedTree, prop === 'text');
                } }
                endEditMode={ () => {
                    this.setState({editPanelState: createEditPanelState(null, 'reveal-from-left', 'fade-to-right')});
                } }
                panelHeight={ editPanelState.leftClass === ''
                    ? 0
                    : this.outerEl.current.getBoundingClientRect().height
                }/>
        </div>;
    }
    /**
     * @param {MenuLink} item
     * @param {Event} e
     * @access private
     */
    openMoreMenu(item, e) {
        this.setState({linkWithNavOpened: item});
        this.contextMenu.current.open(e);
    }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleContextMenuLinkClicked(link) {
        if (link.id === 'edit')
            this.setState({editPanelState: {link: this.state.linkWithNavOpened,
                                            leftClass: 'fade-to-left',
                                            rightClass: 'reveal-from-right'}});
        else if (link.id === 'delete')
            this.applyAndEmit(this.state.parsedTree.filter(link => link !== this.state.linkWithNavOpened));
    }
    /**
     * @access private
     */
    navigateToPageCreate() {
        env.window.myRoute(`/pages/create?addToMenu=${this.currentBlockIdInfo}`);
    }
    /**
     * @access private
     */
    appendItemToMenu() {
        this.applyAndEmit(this.state.parsedTree.concat(this.linkCreator.makeLinkItem({slug: '/', text: __('Link text')})));
    }
    /**
     * @param {Array<MenuLink>} newParsedTree
     * @param {Boolean} doThrottle = false
     * @access private
     */
    applyAndEmit(newParsedTree, doThrottle = false) {
        const a = !doThrottle ? [undefined, undefined] : [env.normalTypingDebounceMillis, 'debounce-re-render-and-commit-to-queue'];
        this.props.emitValueChanged(JSON.stringify(newParsedTree), 'tree', false, ...a);
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
     * @param {RawBlock|RawBlockData} newTree
     * @returns {Array<MenuLink>}
     * @access public
     */
    setGetCounterUsingTreeOf(newTree) {
        const parsedTree = JSON.parse(newTree.tree);
        this.counter = getMaxId(parsedTree);
        return parsedTree;
    }
    /**
     * @param {PartialMenuLink} vals
     * @returns {MenuLink}
     * @access public
     */
    makeLinkItem(vals) {
        const out = Object.assign({}, vals);
        if (!Object.prototype.hasOwnProperty.call(out, 'id'))
            out.id = ++this.counter;
        if (!Object.prototype.hasOwnProperty.call(out, 'children'))
            out.children = [];
        return out;
    }
}

/**
 * @param {MenuLink|null} link = null
 * @param {String} leftClass = ''
 * @param {String} rightClass = ''
 * @returns {{link: MenuLink|null; leftClass: String; rightClass: String;}}
 */
function createEditPanelState(link = null, leftClass = '', rightClass = '') {
    return {link, leftClass, rightClass};
}

/**
 * @param {Array<MenuLink>} branch
 * @param {String} id
 * @returns {MenuLink|null}
 */
function findLinkItem(branch, id) {
    for (const link of branch) {
        if (link.id === id) return link;
        if (link.children.length) {
            const sub = findLinkItem(link.children, id);
            if (sub) return sub;
        }
    }
    return null;
}

/**
 * @param {Array<MenuLink} branch
 * @returns {Number}
 */
function getMaxId(branch) {
    return branch.reduce((max, link) => {
        const currentBranchMax = link.id > max ? link.id : max;
        const childBranchMax = !link.children.length ? 0 : getMaxId(link.children);
        return childBranchMax > currentBranchMax ? childBranchMax : currentBranchMax;
    }, 0);
}

/**
 * @typedef MenuLink
 * @prop {String} text
 * @prop {String} slug
 * @prop {String} id
 * @prop {Array<MenuLink>} children
 *
 * @typedef Menu
 * @prop {String} tree
 * @prop {String} wrapStart
 * @prop {String} wrapEnd
 * @prop {String} treeStart
 * @prop {String} treeEnd
 * @prop {String} itemStart
 * @prop {String} itemAttrs
 * @prop {String} itemEnd
 */

export default MenuBlockEditForm;
export {CountingLinkItemFactory};
