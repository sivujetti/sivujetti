import {__, api, http, env, Icon, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import store, {observeStore, selectCurrentPageDataBundle} from '../../store.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import AddCategoryPanel from './AddCategoryPanel.jsx';

class ManyToManyField extends preact.Component {
    // unregistrables;
    // k;
    // firstPanelEl;
    // relPageType;
    /**
     * @param {{field: PageTypeField; emitChanges: (setChanges: (pageToMutate: Page) => void) => void;}} props
     */
    constructor(props) {
        super(props);
        this.unregistrables = [];
        if (props.field.dataType.type !== 'many-to-many')
            throw new Error('Not implemented yet');
        this.k = props.field.name; // e.g. 'categories'
        this.firstPanelEl = preact.createRef();
        this.state = {
            currentManyToManyIdList: getManyToManyValue(selectCurrentPageDataBundle(store.getState()).page, this.k),
            manyToManyPages: undefined,
            createCatPanelState: createCreateCatPanelStateState(),
        };
        this.unregistrables.push(observeStore(selectCurrentPageDataBundle, ({page}) => {
            if (this.state.currentManyToManyIdList.toString() !== page[this.k].toString())
               this.setState({currentManyToManyIdList: getManyToManyValue(page, this.k)});
        }));
        this.relPageType = api.getPageTypes().find(({name}) => name === props.field.dataType.rel);
        this.fetchManyToManyPagesToState(this.relPageType.name);
        //
        this.unregistrables.push(observeStore2('relPages', ({relPages}, [event]) => {
            if (event === 'relPages/addItem')
                this.setState({manyToManyPages: relPages});
            else if (event === 'relPages/setAll' && this.state.manyToManyPages) // undo
                this.setState({manyToManyPages: relPages});
        }));
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @access protected
     */
    render({field}, {currentManyToManyIdList, manyToManyPages, createCatPanelState}) {
        return <div class="anim-outer pt-1">
            <div class="form-label mb-1">{ __(field.friendlyName) }</div>
            <div class={ createCatPanelState.leftClass } ref={ this.firstPanelEl }>
                <div class="prop-widget-many-to-man">{ Array.isArray(manyToManyPages) ? manyToManyPages.length
                    ? manyToManyPages.map(({id, title}) => <label class="form-checkbox mt-0 text-ellipsis" key={ id }>
                        <input
                            value={ id }
                            onClick={ this.emitManyToManyIdSelectedOrUnselected.bind(this) }
                            checked={ currentManyToManyIdList.indexOf(id) > -1 }
                            type="checkbox"
                            class="form-input"/><i class="form-icon"></i> <span>{ title }</span>
                        </label>)
                    : <p>{ __('No %s found', __(field.friendlyNamePlural)) }</p>
                : <LoadingSpinner/> }</div>
                <button onClick={ this.openCreateCategoryPanel.bind(this) }
                    class="btn btn-sm text-tiny with-icon-inline mt-2" type="button">
                    <Icon iconId="plus" className="size-xs mr-1"/> { __('Add new category') }
                </button>
            </div>
            <AddCategoryPanel
                pageType={ this.relPageType }
                cssClass={ createCatPanelState.rightClass }
                onAddingFinished={ newCategoryPostData => {
                    this.setState({createCatPanelState: createCreateCatPanelStateState('reveal-from-left', 'fade-to-right', false)});
                    if (newCategoryPostData)
                        // todo check if page with identical slug already exist
                        store2.dispatch('relPages/addItem', [createCompactPageFrom(newCategoryPostData), this.relPageType.name]);
                } }
                panelHeight={ createCatPanelState.leftClass === ''
                    ? 0
                    : this.firstPanelEl.current.getBoundingClientRect().height
                }/>
        </div>;
    }
    /**
     * @param {String} pageTypeName
     * @access private
     */
    fetchManyToManyPagesToState(pageTypeName) {
        const {relPages} = store2.get();
        if (relPages) {
            this.setState({manyToManyPages: relPages});
            return;
        }
        http.get(`/api/pages/${pageTypeName}`)
            .then(pages => {
                const baked = pages.reverse().map(createCompactPageFrom);
                store2.dispatch('relPages/setAll', [baked]);
                this.setState({manyToManyPages: baked});
            })
            .catch(env.window.console.error);
    }
    /**
     * @param {Event} e
     * @access private
     */
    emitManyToManyIdSelectedOrUnselected(e) {
        const val = e.target.checked ? 1 : 0;
        const manyToManyPageId = e.target.value;
        const bundle = selectCurrentPageDataBundle(store.getState());
        const cur = bundle.page[this.k].indexOf(manyToManyPageId) > -1 ? 1 : 0;
        let newManyToManyIdList; // e.g. categories
        if (cur === 0 && val === 1) {
            newManyToManyIdList = bundle.page[this.k].concat([manyToManyPageId]);
        } else if (cur === 1 && val === 0) {
            newManyToManyIdList = bundle.page[this.k].filter(manyToManyPageId2 => manyToManyPageId2 !== manyToManyPageId);
        } else return;
        this.props.emitChanges(mut => {
            mut[this.k] = newManyToManyIdList;
        });
    }
    /**
     * @access private
     */
    openCreateCategoryPanel() {
        this.setState({createCatPanelState: createCreateCatPanelStateState(
            'fade-to-left',
            'reveal-from-right',
            true
        )});
    }
}

/**
 * @param {{[key: String]: any;}} from
 * @returns {RelPage}
 */
function createCompactPageFrom(from) {
    return {id: from.id, title: from.title, slug: from.slug, path: from.path};
}

/**
 * @param {Page} from
 * @param {String} propName
 * @returns {Array<String>}
 */
function getManyToManyValue(from, propName) {
    return from[propName].slice(0);
}

/**
 * @param {String} leftClass = ''
 * @param {String} rightClass = ''
 * @returns {{leftClass: String; rightClass: String;}}
 */
function createCreateCatPanelStateState(leftClass = '', rightClass = '') {
    return {leftClass, rightClass};
}

export default ManyToManyField;
