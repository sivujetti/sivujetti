import {__} from './temp.js';
import services from './services.js';

let counter=0;
    /**
     * Käyttö:
     * ```
     * class MyComponent extends preact.Component {
     *     constructor(props) {
     *         ...
     *         this.sortable = new Sortable();
     *         ...
     *     }
     *     render() {
     *         return <ul ref={ el => this.sortable.register(el) }>...</ul>
     *     }
     * }
     * ```
     */
    class Sortable {
        /**
         */
        constructor() {
            this.el = null;
            this.instance = null;
        }
        /**
         * @param {HTMLElement} el
         * @param {Object} options github.com/SortableJS/Sortable#options
         */
        register(el, options) {
            if (!el || this.el === el)
                return;
            this.el = el;
            if (options.onReorder && !options.onEnd) options.onEnd = e => {
                if (e.newIndex === e.oldIndex) return;
                options.onReorder(this.instance.toArray());
            };
            this.instance = window.Sortable.create(el, Object.assign({
                group: `instance-${++counter}`,
                animation: 100,
            }, options));
        }
        /**
         * @return {Object}
         */
        getImpl() {
            return this.instance;
        }
    }
const todoIsBlockSavedToBackend = (_blockRef, blockData) =>
    !blockData.id.startsWith('new-')
;

const menuBlockGetInitialData = () => ({
    tree: JSON.stringify([{id: 1, url: '/', text: __('Home'), children: []}]),
    treeStart: '', // default '<ul>'
    itemStart: '', // '<li>'
});

const menuBlockReRender = (newDataFromForm, blockRef, prevData) => {
    if (!todoIsBlockSavedToBackend(blockRef, prevData))
        blockRef.tryToReRenderWithHtml(`<p>${__('Loading')} ...</p>`);
    const p = Object.assign(menuBlockGetInitialData(), {tree: newDataFromForm.tree});
    services.http.post('/api/defaults/menu/render-template/kuura:menu', p)
        .then(resp => blockRef.tryToReRenderWithHtml(resp.html))
        .catch(window.console.error);
};

class MainPanel extends preact.Component {
    constructor(props) {
        super(props);
        this.sortable = new Sortable();
    }
    render({tree}) {
        return <div>
            <table class="table"><tbody ref={ this.activateSorting.bind(this) }>{ tree.map(item =>
                <tr key={ item.id } data-id={ item.id }>
                    <td class="drag-column">
                        <button class="drag-handle" type="button">::</button>
                    </td>
                    <td>{ item.text }</td>
                    <td><button onClick={ () => this.props.onEditItemBtnClicked(item) } type="button">E</button></td>
                </tr>
            ) }</tbody></table>
           <button onClick={ () => this.props.onAddItemBtnClicked() } title={ __('Lisää linkki valikkoon') } class="btn btn-sm" type="button">{ __('Lisää linkki') }</button>
        </div>;
    }
    /**
     * @access private
     */
    activateSorting(tbodyEl) {
        this.sortable.register(tbodyEl, {
            handle: '.drag-handle',
            onReorder: orderedIds => {
                //
            },
        });
    }
}

class EditItemPanel extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {d: null};
    }
    componentDidMount(props) {
        this.setState({d: Object.assign({}, this.props.cei)});
    }
    render(_, {d}) {
        return <>
            <button class="btn btn-sm btn-link" type="button">&lt; { __('Back') }</button>
            <input value="foo"/>
            <button onClick={ () => { d.text = 'Foo'; this.props.onConfirm(d); } } class="btn btn-sm" type="button">{ __('Apply') }</button>
        </>;
    }
}

class CreateMenuBlockFormInputs extends preact.Component {
    constructor(props) {
        super(props);
        this.sortable = new Sortable();
        this.r = Object.assign({}, props.blockData);
        this.state = {tree: JSON.parse(props.blockData.tree),
                      panel: 'main',
                      cei: null};
    }
    render(_, {panel, tree, cei}) {
        return panel === 'main'
            ? <MainPanel tree={ tree } onAddItemBtnClicked={ this.addItem.bind(this) } onEditItemBtnClicked={ this.beginEditMode.bind(this) }/>
            : <EditItemPanel cei={ cei } onConfirm={ this.applyEdit.bind(this) }/>;
    }
    applyLatestValue() {
        this.props.blockData.tree = JSON.stringify(this.state.tree);
    }
    addItem() {
        const ref = this.state.tree;
        ref.push({id: ++counter, url: '/', text: __('Link text'), children: []});
        this.props.onValueChanged(Object.assign(this.r, {tree: JSON.stringify(ref)}));
        this.setState({tree: ref});
    }
    beginEditMode(item) {
        this.setState({panel: 'edit', cei: item});
    }
    applyEdit(newData) {
        const ref = this.state.tree.find(item => item.id === newData.id);
        Object.assign(ref, newData);
        this.props.onValueChanged(Object.assign(this.r, {tree: JSON.stringify(this.state.tree)}));
        this.setState({panel: 'main', tree: this.state.tree});
    }
    deleteItem(f) {
    }
}

class EditMenuBlockFormInputs extends CreateMenuBlockFormInputs { }

const blockType = {
    reRender: menuBlockReRender,
    getInitialData: menuBlockGetInitialData,
    EditFormImpl: CreateMenuBlockFormInputs,
    CreateFormImpl: EditMenuBlockFormInputs,
    friendlyName: 'Menu',
    defaultRenderer: 'kuura:menu',
};

export default blockType;
