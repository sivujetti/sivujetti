import {__} from '@sivujetti-commons';
import Icon from '../../../../commons/Icon.jsx';
import EditItemPanel from './EditItemPanel.jsx';

let counter = 0;

class MenuBlockEditForm extends preact.Component {
    // outerEl;
    /**
     * @param {BlockEditFormProps} props
     */
    constructor(props) {
        super(props);
        this.state = createState();
        this.outerEl = preact.createRef();
    }
    /**
     * @param {Array<MenuLink>} mutatedTree
     * @access public
     */
    endEditMode(mutatedTree) {
        this.setState({parsedTree: mutatedTree,
            editPanelIsOpen: false,
            itemCurrentlyBeingEdited: null,
            panelLeftClass: 'reveal-from-left',
            panelRightClass: 'fade-to-right'});
    }
    /**
     * @param {Array<MenuLink>} mutatedTree
     * @access public
     */
    onTreeUpdated(mutatedTree) {
        this.props.onValueChanged(this.createRawBlock(mutatedTree));
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const state = createState(JSON.parse(this.props.block.tree));
        const getMaxId = branch =>
            branch.reduce((max, link) => {
                const currentBranchMax = link.id > max ? link.id : max;
                const childBranchMax = !link.children.length ? 0 : getMaxId(link.children);
                return childBranchMax > currentBranchMax ? childBranchMax : currentBranchMax;
            }, 0)
        ;
        counter = getMaxId(state.parsedTree);
        this.setState(state);
    }
    /**
     * @access protected
     */
    render(_, {parsedTree, itemCurrentlyBeingEdited, panelLeftClass, panelRightClass}) {
        return <div class="anim-outer">
            <div class={ panelLeftClass } ref={ this.outerEl }>
                <ul class="list">{ parsedTree.map(item => <li class="ml-2"><div class="d-flex flex-centered" key={ item.id }>
                    <span>{ item.text }</span>
                    <button onClick={ () => this.openForEdit(item) } class="btn btn-sm btn-link col-ml-auto flex-centered" type="button">
                        <Icon iconId="edit-2" className="size-xs"/>
                    </button>
                </div></li>) }</ul>
                <button onClick={ this.appendItemToMenu.bind(this) }
                    class="btn btn-sm text-tiny with-icon-inline color-dimmed mt-1" type="button">
                    <Icon iconId="plus" className="size-xs mr-1"/> { __('Add item') }
                </button>
            </div>
            <EditItemPanel
                link={ itemCurrentlyBeingEdited }
                cssClass={ panelRightClass }
                panelAHeight={ panelRightClass !== 'reveal-from-right'
                    ? 0
                    : this.outerEl.current.getBoundingClientRect().height }
                parent={ this }/>
        </div>;
    }
    /**
     * @param {MenuLink} item
     * @access private
     */
    openForEdit(item) {
        this.setState({editPanelIsOpen: true,
            itemCurrentlyBeingEdited: item,
            panelLeftClass: 'fade-to-left',
            panelRightClass: 'reveal-from-right'});
    }
    /**
     * @access private
     */
    appendItemToMenu() {
        const newParsed = this.state.parsedTree.concat(
            makeLinkItem({slug: '/', text: __('Link text')})
        );
        this.setState({parsedTree: newParsed});
        this.props.onValueChanged(this.createRawBlock(newParsed));
    }
    /**
     * @param {Array<MenuLink>} newParsedTree
     * @returns {Menu}
     * @access private
     */
    createRawBlock(newParsedTree) {
        const block = this.props.block;
        return {
            tree: JSON.stringify(newParsedTree),
            wrapStart: block.wrapStart,
            wrapEnd: block.wrapEnd,
            treeStart: block.treeStart,
            treeEnd: block.treeEnd,
            itemAttrs: block.itemAttrs,
            itemEnd: block.itemEnd,
        };
    }
}

function createState(parsedTree = null) {
    return {
        parsedTree,
        editPanelIsOpen: false,
        itemCurrentlyBeingEdited: null,
        panelLeftClass: '',
        panelRightClass: 'd-none'
    };
}

function makeLinkItem(vals) {
    const out = Object.assign({}, vals);
    if (!Object.prototype.hasOwnProperty.call(out, 'id'))
        out.id = ++counter;
    if (!Object.prototype.hasOwnProperty.call(out, 'children'))
        out.children = [];
    return out;
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
 * @prop {String} itemAttrs
 * @prop {String} itemEnd
 */

export default MenuBlockEditForm;
export {makeLinkItem};
