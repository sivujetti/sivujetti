import {__} from '../../commons/main.js';
import Icon from '../../commons/Icon.jsx';
import EditItemPanel from './EditItemPanel.jsx';

let counter = 0;

/**
 * @type {preact.FunctionalComponent<BlockEditFormProps>}
 */
const MenuBlockEditForm = ({funcsIn, funcsOut, block}) => {
    const [parsedTree, setParsedTree] = preactHooks.useState(() => JSON.parse(block.tree));
    const [editPanelState, setEditPanelState] = preactHooks.useState(createEditPanelState);
    const outerEl = preactHooks.useMemo(() => preact.createRef(), []);
    //
    preactHooks.useEffect(() => {
        counter = getMaxId(parsedTree);
    }, []);
    //
    funcsOut.resetValues = preactHooks.useCallback((newValue) => {
        const n = JSON.parse(newValue.tree);
        setParsedTree(n);
        // newValue.wrapStart Not in use yet
        // newValue.wrapEnd Not in use yet
        // newValue.treeStart Not in use yet
        // newValue.treeEnd Not in use yet
        // newValue.itemStart Not in use yet
        // newValue.itemAttrs Not in use yet
        // newValue.itemEnd Not in use yet
        if (editPanelState.link)
            itemPanelFuncsOut.doOpen(n.find(({id}) => id === editPanelState.link.id), n);
    });
    //
    const openItemForEdit = preactHooks.useCallback(item => {
        setEditPanelState({link: item, leftClass: 'fade-to-left',});
        itemPanelFuncsOut.doOpen(item, parsedTree);
    });
    const appendItemToMenu = preactHooks.useCallback(() => {
        const newParsed = parsedTree.concat(makeLinkItem({slug: '/', text: __('Link text')}));
        setParsedTree(newParsed);
        funcsIn.onValueChanged(JSON.stringify(newParsed), 'tree', false);
    });
    const itemPanelFuncsOut = preactHooks.useRef({});
    //
    return <div class="anim-outer">
        <div class={ editPanelState.leftClass } ref={ outerEl }>
            <ul class="list">{ parsedTree.map(item => <li class="ml-2" key={ item.id }><div class="d-flex flex-centered">
                <span>{ item.text }</span>
                <button onClick={ () => openItemForEdit(item) } class="btn btn-sm btn-link col-ml-auto flex-centered" type="button">
                    <Icon iconId="pencil" className="size-sm"/>
                </button>
            </div></li>) }</ul>
            <button onClick={ appendItemToMenu }
                class="btn btn-sm text-tiny with-icon-inline color-dimmed mt-1" type="button">
                <Icon iconId="plus" className="size-xs mr-1"/> { __('Add item') }
            </button>
        </div>
        <EditItemPanel
            funcsOut={ itemPanelFuncsOut }
            panelAHeight={ preactHooks.useMemo(() =>
                editPanelState.leftClass === ''
                    ? 0
                    : outerEl.current.getBoundingClientRect().height
            , [editPanelState.leftClass]) }
            api={ preactHooks.useMemo(() => ({
                /**
                 * @param {Array<MenuLink>} mutatedTree
                 */
                endEditMode(mutatedTree) {
                    if (mutatedTree) setParsedTree(mutatedTree);
                    setEditPanelState({link: null, leftClass: 'reveal-from-left',});
                },
                /**
                 * @param {Array<MenuLink>} mutatedTree
                 */
                onTreeUpdated(mutatedTree) {
                    funcsIn.onValueChanged(JSON.stringify(mutatedTree), 'tree', false);
                }
            })) }/>
    </div>;
};

/**
 * @returns {{link: MenuLink|null; leftClass: String;}}
 */
function createEditPanelState() {
    return {link: null, leftClass: '',};
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
