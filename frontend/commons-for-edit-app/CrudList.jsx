import {__, api} from './edit-app-singletons.js';
import {Icon} from './Icon.jsx';
import Sortable from './Sortable.js';

let counter = 0;

/**
 * @template T
 */
class CrudList extends preact.Component {
    // editFormRef;
    // sortable; // public
    // itemWithNavOpened; // public
    /**
     * @param {{items: Array<T>; onListMutated: (newList: Array<T>, prop: string = null, subProp: string = null) => void; createNewItem: (...varArgs: any) => T; editForm: preact.AnyComponent; editFormProps?: {[key: string]: any;}; itemTypeFriendlyName?: string; itemTitleKey?: string; getTitle?: (item: T) => preact.ComponentChild; contextMenuPos?: string; contextMenuZIndex?: number; onCreateCtxMenuCtrl?: (ctrl: ContextMenuController) => ContextMenuController; renderAddItemButton?: () => preact.ComponentChild;}} props
     */
    constructor(props) {
        super(props);
        this.editFormRef = preact.createRef();
        this.state = {items: this.addKeys(this.props.items), tab: 'default'};
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.sortable = new Sortable();
        this.getTitle = this.props.getTitle ? this.props.getTitle : (item => item[this.props.itemTitleKey]);
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.items !== this.props.items) {
            const items = this.addKeys(props.items);
            if (!this.state.editItem)
                this.setState({items});
            else {
                const editItemIdx = this.state.items.findIndex(({key}) => key === this.state.editItem.key);
                const editItem = items[editItemIdx];
                this.setState({items, editItem: editItem || null, editItemIdx: editItemIdx > -1 ? editItemIdx : null});
                const fn = this.editFormRef.current.overrideValues;
                if (fn) this.editFormRef.current.overrideValues(editItem || null);
            }
        }
    }
    /**
     * @access protected
     */
    render({editForm, itemTypeFriendlyName, editFormProps, renderAddItemButton}, {items, tab}) {
        if (!items)
            return;
        if (tab === 'default') return [
            <ul class="list table-list container px-0" ref={ this.activateSorting.bind(this) }>{ items.length ? items.map((item, i) =>
                <li data-id={ item.key } key={ item.key } class="columns py-1">
                    <div class="col-2">
                        <button class="drag-handle with-icon" title={ __('Drag') } type="button">
                            <Icon iconId="grid-dots" className="size-xs mr-0"/>
                        </button>
                    </div>
                    <div class="col-8 text-ellipsis">
                        { this.getTitle(item) }
                    </div>
                    <div class="col-2">
                        <button onClick={ e => this.openMoreMenu(item, i, e) } class="btn btn-sm btn-link col-ml-auto flex-centered" type="button">
                            <Icon iconId="dots" className="size-sm"/>
                        </button>
                    </div>
                </li>) : <li>-</li> }
            </ul>,
            renderAddItemButton ? renderAddItemButton() : <button
                onClick={ () => this.addNewItem() }
                title={ __('Add %s', itemTypeFriendlyName) }
                class="btn btn-sm text-tiny with-icon-inline color-dimmed mt-1"
                type="button">
                <Icon iconId="plus" className="size-xs mr-1"/>
                { __('Add %s', itemTypeFriendlyName) }
            </button>,
        ];
        //
        if (tab === 'edit') {
            const Impl = editForm;
            return <Impl
                { ...(editFormProps || {}) }
                item={ this.state.editItem }
                onValueChanged={ (value, key, subKey = null) => {
                    const updatedItems = this.state.items.map((itm, i) => i !== this.state.editItemIdx ? itm : {...itm, [key]: value});
                    this.setState({item: updatedItems, editItem: updatedItems[this.state.editItemIdx]});
                    this.emitListMutated(updatedItems, key, subKey);
                } }
                done={ () => this.setState({tab: 'default', editItem: null, editItemIdx: null}) }
                ref={ this.editFormRef }/>;
        }
    }
    /**
     * @param {T} item
     * @param {number} i
     * @param {Event} e
     * @access private
     */
    openMoreMenu(item, i, e) {
        this.itemWithNavOpened = item;
        this.itemWithNavOpenedIdx = i;
        const ctrl = {
            getLinks: () => [
                {text: __('Edit'), title: __('Edit'), id: 'edit-option'},
                {text: __('Delete'), title: __('Delete'), id: 'delete-option'},
            ],
            onItemClicked: this.handleContextMenuLinkClicked.bind(this),
            onMenuClosed: () => { this.itemWithNavOpened = null; this.itemWithNavOpenedIdx = null; },
            placement: this.props.contextMenuPos || 'right',
            zIndex: this.props.contextMenuZIndex || undefined,
        };
        api.contextMenu.open(e, this.props.onCreateCtxMenuCtrl
            ? this.props.onCreateCtxMenuCtrl(ctrl)
            : ctrl);
    }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleContextMenuLinkClicked(link) {
        if (link.id === 'edit-option') {
            this.setState({tab: 'edit', editItem: this.itemWithNavOpened, editItemIdx: this.itemWithNavOpenedIdx});
        } else if (link.id === 'delete-option') {
            const items = this.state.items.filter((_, i) => i !== this.itemWithNavOpenedIdx);
            if (!this.state.editItem)
                this.setState({items});
            else {
                const idxNew = items.findIndex(({key}) => key === this.state.editItem.key);
                const editItem = idxNew > -1 ? items[idxNew] : null;
                this.setState({items, editItem, editItemIdx: editItem ? idxNew : null});
            }
            this.emitListMutated(items);
        }
    }
    /**
     * @param {Array<T && {key: string;}>} items
     * @param {string} prop = null
     * @param {string} subProp = null
     * @access private
     */
    emitListMutated(items, prop = null, subProp = null) {
        this.props.onListMutated(removeKeys(items), prop, subProp);
    }
    /**
     * @access private
     */
    activateSorting(tbodyEl) {
        this.sortable.register(tbodyEl, {
            handle: '.drag-handle',
            onReorder: orderedIds => {
                const ordered = orderedIds.map(key => this.state.items.find(f => f.key === key));
                this.setState({items: ordered});
                this.emitListMutated(ordered);
            },
        });
    }
    /**
     * @param {Array<T>} items
     * @returns {Array<T && {key: string;}>}
     * @access private
     */
    addKeys(items) {
        for (const item of items) {
            if (item.key)
                throw new Error('Expected item.key not to exist');
            if (!item[this.props.itemTitleKey])
                throw new Error('item[props.itemTitleKey] not defined');
        }
        return items.map(item => ({...item, ...{
            key: (++counter).toString(),
        }}));
    }
    /**
     * @param {any[]} ...varArgs
     * @access private
     */
    addNewItem(...varArgs) {
        const newItem = {...this.props.createNewItem(...varArgs)};
        if (!newItem.key) newItem.key = (++counter).toString();
        const newList = this.state.items.concat(newItem);
        this.setState({items: newList});
        this.emitListMutated(newList);
    }
}

/**
 * @param {Array<T && {key: string;}>} items
 * @returns {Array<Object>}
 */
function removeKeys(items) {
    return items.map(item => {
        const out = {...item};
        delete out.key;
        return out;
    });
}

export default CrudList;
