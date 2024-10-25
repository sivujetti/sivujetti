import {env, http} from '@sivujetti-commons-for-web-pages';
import {__, api} from '../../edit-app-singletons.js';
import {Icon} from '../../Icon.jsx';
import LoadingSpinner from '../../LoadingSpinner.jsx';
import {isUndoOrRedo, objectUtils} from '../../utils.js';
import AddCategoryPanel from './AddCategoryPanel.jsx';

class ManyToManyItemSelector extends preact.Component {
    // unregistrables;
    // selectionType;
    /**
     * @param {{curSelections: Array<string>; onSelectionsChanged: (newSelections: Array<string>) => void; relPageType: PageType; onItemsFetched?: (manyToManyPages: Array<RelPage>) => void; useRadios?: boolean;}} props
     */
    constructor(props) {
        super(props);
        this.selectionType = !props.useRadios ? 'checkbox' : 'radio';
        this.state = {
            currentManyToManyIdList: props.curSelections.slice(0),
            manyToManyPages: undefined,
        };
        this.fetchManyToManyPagesToState(props.relPageType.name);
        //
        this.unregistrables = [api.saveButton.getInstance().subscribeToChannel('quicklyAddedPages', (pages, userCtx, ctx) => {
            if (ctx === 'init' || isUndoOrRedo(ctx) || userCtx?.event === 'create')
                this.setState({manyToManyPages: pages});
        })];
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
    componentWillReceiveProps(props) {
        if (props.curSelections.toString() !== this.props.curSelections.toString())
            this.setState({currentManyToManyIdList: props.curSelections.slice(0)});
    }
    /**
     * @access protected
     */
    render({relPageType, useRadios}, {currentManyToManyIdList, manyToManyPages}) {
        return Array.isArray(manyToManyPages) ? manyToManyPages.length
            ? manyToManyPages.map(({id, title}) => <label class={ `form-${this.selectionType} d-inline-block mt-0 text-ellipsis` } key={ id }>
                <input
                    value={ id }
                    onClick={ this.handleCheckboxOrRadioClicked.bind(this) }
                    checked={ currentManyToManyIdList.indexOf(id) > -1 }
                    type={ this.selectionType }
                    name={ 'todo' }
                    class={ !useRadios ? 'form-input' : '' }/><i class="form-icon"></i> <span class="c-hand pt-2 pr-2 pb-2">{ title }</span>
                </label>)
            : <p>{ __('No %s found', __(relPageType.friendlyNamePlural)) }</p>
        : <LoadingSpinner/>;
    }
    /**
     * @param {string} pageTypeName
     * @access private
     */
    fetchManyToManyPagesToState(pageTypeName) {
        const saveButton = api.saveButton.getInstance();
        const pages = saveButton.getChannelState('quicklyAddedPages');
        if (pages) {
            if (this.props.onItemsFetched) this.props.onItemsFetched(pages);
            this.setState({manyToManyPages: pages});
            return;
        }
        http.get(`/api/pages/${pageTypeName}`)
            .then(pages => {
                const baked = pages.map(createCompactPageFrom);
                saveButton.initChannel('quicklyAddedPages', baked);
                if (this.props.onItemsFetched) this.props.onItemsFetched(baked);
                this.setState({manyToManyPages: baked});
            })
            .catch(env.window.console.error);
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleCheckboxOrRadioClicked(e) {
        const manyToManyPageId = e.target.value;
        const {currentManyToManyIdList} = this.state;
        //
        let newSelections;
        if (!this.props.useRadios) {
            const cur = currentManyToManyIdList.indexOf(manyToManyPageId) > -1 ? 1 : 0;
            const val = e.target.checked ? 1 : 0;
            if (cur === 0 && val === 1) {
                newSelections = [...this.state.currentManyToManyIdList, manyToManyPageId];
            } else if (cur === 1 && val === 0) {
                newSelections = currentManyToManyIdList.filter(manyToManyPageId2 => manyToManyPageId2 !== manyToManyPageId);
            }
        } else if ((currentManyToManyIdList[0] || '') !== manyToManyPageId) {
            newSelections = [manyToManyPageId];
        }
        //
        if (newSelections) {
            this.props.onSelectionsChanged(newSelections);
            this.setState({currentManyToManyIdList: newSelections});
        }
    }
}

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
        if (props.field.dataType.type !== 'many-to-many')
            throw new Error('Not implemented yet');
        this.k = props.field.name; // e.g. 'categories'
        this.firstPanelEl = preact.createRef();
        const saveButton = api.saveButton.getInstance();
        this.state = {
            currentManyToManyIdList: getManyToManyValue(saveButton.getChannelState('currentPageData'), this.k),
            createCatPanelState: createCreateCatPanelStateState(),
        };
        this.unregistrables = [saveButton.subscribeToChannel('currentPageData', (page, _userCtx, _ctx) => {
            if (this.state.currentManyToManyIdList.toString() !== page[this.k].toString())
               this.setState({currentManyToManyIdList: getManyToManyValue(page, this.k)});
        })];
        this.relPageType = api.getPageTypes().find(({name}) => name === props.field.dataType.rel);
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
    render({field}, {currentManyToManyIdList, createCatPanelState}) {
        return <div class="pt-1">
            <div class="anim-outer">
                <div class={ `fieldset${createCatPanelState.leftClass === '' ? ' pr-0' : ''}` }>
                    <div class="form-label legend">{ __(field.friendlyName) }</div>
                    <div class={ createCatPanelState.leftClass } ref={ this.firstPanelEl }>
                        <div class="prop-widget-many-to-many">
                            <ManyToManyItemSelector
                                curSelections={ currentManyToManyIdList }
                                onSelectionsChanged={ this.emitManyToManyIdSelectedOrUnselected.bind(this) }
                                relPageType={ this.relPageType }/>
                        </div>
                        <button onClick={ this.openCreateCategoryPanel.bind(this) }
                            class="btn btn-sm text-tiny with-icon-inline mt-2" type="button">
                            <Icon iconId="plus" className="size-xs mr-1"/> { __('Add new %s', __('category')) }
                        </button>
                    </div>
                    <AddCategoryPanel
                        pageType={ this.relPageType }
                        cssClass={ createCatPanelState.rightClass }
                        onAddingFinished={ newCompactPage => {
                            this.setState({createCatPanelState: createCreateCatPanelStateState('reveal-from-left', 'fade-to-right', false)});
                            if (newCompactPage) {
                                const saveButton = api.saveButton.getInstance();
                                saveButton.pushOp(
                                    'quicklyAddedPages',
                                    [
                                        createCompactPageFrom(newCompactPage),
                                        ...objectUtils.cloneDeep(saveButton.getChannelState('quicklyAddedPages'))
                                    ],
                                    {event: 'create'},
                                );
                            }
                        } }
                        panelHeight={ createCatPanelState.leftClass === ''
                            ? 0
                            : this.firstPanelEl.current.getBoundingClientRect().height
                        }/>
                </div>
            </div>
        </div>;
    }
    /**
     * @param {Array<string>} newManyToManyIdList
     * @access private
     */
    emitManyToManyIdSelectedOrUnselected(newManyToManyIdList) {
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
 * @param {{[key: string]: any;}} from
 * @returns {RelPage}
 */
function createCompactPageFrom(from) {
    return {
        id: from.id,
        title: from.title,
        slug: from.slug,
        path: from.path,
        type: from.type,
    };
}

/**
 * @param {Page} from
 * @param {string} propName
 * @returns {Array<string>}
 */
function getManyToManyValue(from, propName) {
    return from[propName].slice(0);
}

/**
 * @param {string} leftClass = ''
 * @param {string} rightClass = ''
 * @returns {{leftClass: string; rightClass: string;}}
 */
function createCreateCatPanelStateState(leftClass = '', rightClass = '') {
    return {leftClass, rightClass};
}

export default ManyToManyField;
export {ManyToManyItemSelector};
