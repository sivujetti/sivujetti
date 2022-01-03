import {__} from '../../commons/main.js';
import Icon from '../../commons/Icon.jsx';
import EditItemPanel from './EditItemPanel.jsx';

let counter = 0;

class MenuBlockEditForm extends preact.Component {
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        const newState = {parsedTree: getSetTree(snapshot)};
        const editPanelState = this.state.editPanelState;
        if (editPanelState.link)
            newState.editPanelState = createEditPanelState(
                findLinkItem(newState.parsedTree, editPanelState.link.id),
                editPanelState.leftClass,
                editPanelState.rightClass);
        this.setState(newState);
        // snapshot.wrapStart Not in use yet
        // snapshot.wrapEnd Not in use yet
        // snapshot.treeStart Not in use yet
        // snapshot.treeEnd Not in use yet
        // snapshot.itemStart Not in use yet
        // snapshot.itemAttrs Not in use yet
        // snapshot.itemEnd Not in use yet
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.setState({parsedTree: getSetTree(this.props.block),
                       editPanelState: createEditPanelState()});
        this.outerEl = preact.createRef();
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render({onValueChanged}, {parsedTree, editPanelState}) {
        if (!editPanelState) return;
        return <div class="anim-outer">
            <div class={ editPanelState.leftClass } ref={ this.outerEl }>
                <ul class="list">{ parsedTree.map(item => <li class="ml-2" key={ item.id }><div class="d-flex flex-centered">
                    <span>{ item.text }</span>
                    <button onClick={ () => this.openItemForEdit(item) } class="btn btn-sm btn-link col-ml-auto flex-centered" type="button">
                        <Icon iconId="pencil" className="size-sm"/>
                    </button>
                </div></li>) }</ul>
                <button onClick={ this.appendItemToMenu.bind(this) }
                    class="btn btn-sm text-tiny with-icon-inline color-dimmed mt-1" type="button">
                    <Icon iconId="plus" className="size-xs mr-1"/> { __('Add item') }
                </button>
            </div>
            <EditItemPanel
                link={ editPanelState.link }
                cssClass={ editPanelState.rightClass }
                onLinkUpdated={ mutatedLink => {
                    const ref = findLinkItem(this.state.parsedTree, mutatedLink.id);
                    Object.assign(ref, mutatedLink); // Mutates this.state.parsedTree
                    this.setState({parsedTree: this.state.parsedTree});
                    onValueChanged(JSON.stringify(this.state.parsedTree), 'tree', false);
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
     * @access private
     */
    appendItemToMenu() {
        const newParsed = this.state.parsedTree.concat(makeLinkItem({slug: '/', text: __('Link text')}));
        this.setState({parsedTree: newParsed});
        this.props.onValueChanged(JSON.stringify(newParsed), 'tree', false);
    }
    /**
     * @param {MenuLink} item
     * @access private
     */
    openItemForEdit(item) {
        this.setState({editPanelState: {link: item, leftClass: 'fade-to-left', rightClass: 'reveal-from-right'}});
    }
}

/**
 * @param {Block|RawBlockData} from
 * @returns {Array<MenuLink>}
 * @access private
 */
function getSetTree(from) {
    const parsedTree = JSON.parse(from.tree);
    counter = getMaxId(parsedTree);
    return parsedTree;
}

/**
 * @param {MenuLink|null} link = null
 * @param {String} leftClass = ''
 * @param {String} rightClass = ''
 * @returns {{link: MenuLink|null; leftClass: String; leftClass: String;}}
 */
function createEditPanelState(link = null, leftClass = '', rightClass = '') {
    return {link, leftClass, rightClass};
}

/**
 * @param {{text: String; slug: String; [key: String]: any;}} vals
 * @returns {MenuLink}
 */
function makeLinkItem(vals) {
    const out = Object.assign({}, vals);
    if (!Object.prototype.hasOwnProperty.call(out, 'id'))
        out.id = ++counter;
    if (!Object.prototype.hasOwnProperty.call(out, 'children'))
        out.children = [];
    return out;
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
export {makeLinkItem};
