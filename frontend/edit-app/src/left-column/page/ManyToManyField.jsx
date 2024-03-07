// ## import {__, api, http, env, Icon, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
// ## import store, {observeStore, selectCurrentPageDataBundle} from '../../store.js';
// ## import store2, {observeStore as observeStore2} from '../../store2.js';
// ## import AddCategoryPanel from './AddCategoryPanel.jsx';
// ## 
// ## class ManyToManyItemSelector extends preact.Component {
// ##     // unregistrables;
// ##     // selectionType;
// ##     /**
// ##      * @param {{curSelections: Array<String>; onSelectionsChanged: (newList: Array<String>) => void; relPageType: PageType; onItemsFetched?: (manyToManyPages: Array<RelPage>) => void; useRadios?: Boolean;}} props
// ##      */
// ##     constructor(props) {
// ##         super(props);
// ##         this.unregistrables = [];
// ##         this.selectionType = !props.useRadios ? 'checkbox' : 'radio';
// ##         this.state = {
// ##             currentManyToManyIdList: props.curSelections.slice(0),
// ##             manyToManyPages: undefined,
// ##         };
// ##         this.fetchManyToManyPagesToState(props.relPageType.name);
// ##         //
// ##         this.unregistrables.push(observeStore2('pagesListings', ({pagesListings}, [event]) => {
// ##             if (event === 'pagesListings/addItem')
// ##                 this.setState({manyToManyPages: pagesListings});
// ##             else if (event === 'pagesListings/setAll' && this.state.manyToManyPages) // undo
// ##                 this.setState({manyToManyPages: pagesListings});
// ##         }));
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillUnmount() {
// ##         this.unregistrables.forEach(unreg => unreg());
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillReceiveProps(props) {
// ##         if (props.curSelections.toString() !== this.props.curSelections.toString())
// ##             this.setState({currentManyToManyIdList: props.curSelections.slice(0)});
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render({relPageType, useRadios}, {currentManyToManyIdList, manyToManyPages}) {
// ##         return Array.isArray(manyToManyPages) ? manyToManyPages.length
// ##             ? manyToManyPages.map(({id, title}) => <label class={ `form-${this.selectionType} mt-0 text-ellipsis` } key={ id }>
// ##                 <input
// ##                     value={ id }
// ##                     onClick={ this.handleCheckboxOrRadioClicked.bind(this) }
// ##                     checked={ currentManyToManyIdList.indexOf(id) > -1 }
// ##                     type={ this.selectionType }
// ##                     name={ 'todo' }
// ##                     class={ !useRadios ? 'form-input' : '' }/><i class="form-icon"></i> <span>{ title }</span>
// ##                 </label>)
// ##             : <p>{ __('No %s found', __(relPageType.friendlyNamePlural)) }</p>
// ##         : <LoadingSpinner/>;
// ##     }
// ##     /**
// ##      * @param {String} pageTypeName
// ##      * @access private
// ##      */
// ##     fetchManyToManyPagesToState(pageTypeName) {
// ##         const {pagesListings} = store2.get();
// ##         if (pagesListings) {
// ##             if (this.props.onItemsFetched) this.props.onItemsFetched(pagesListings);
// ##             this.setState({manyToManyPages: pagesListings});
// ##             return;
// ##         }
// ##         http.get(`/api/pages/${pageTypeName}`)
// ##             .then(pages => {
// ##                 const baked = pages.reverse().map(createCompactPageFrom);
// ##                 store2.dispatch('pagesListings/setAll', [baked]);
// ##                 if (this.props.onItemsFetched) this.props.onItemsFetched(baked);
// ##                 this.setState({manyToManyPages: baked});
// ##             })
// ##             .catch(env.window.console.error);
// ##     }
// ##     /**
// ##      * @param {Event} e
// ##      * @access private
// ##      */
// ##     handleCheckboxOrRadioClicked(e) {
// ##         const manyToManyPageId = e.target.value;
// ##         const {currentManyToManyIdList} = this.state;
// ##         //
// ##         let newList;
// ##         if (!this.props.useRadios) {
// ##             const cur = currentManyToManyIdList.indexOf(manyToManyPageId) > -1 ? 1 : 0;
// ##             const val = e.target.checked ? 1 : 0;
// ##             if (cur === 0 && val === 1) {
// ##                 newList = [...this.state.currentManyToManyIdList, manyToManyPageId];
// ##             } else if (cur === 1 && val === 0) {
// ##                 newList = currentManyToManyIdList.filter(manyToManyPageId2 => manyToManyPageId2 !== manyToManyPageId);
// ##             }
// ##         } else if ((currentManyToManyIdList[0] || '') !== manyToManyPageId) {
// ##             newList = [manyToManyPageId];
// ##         }
// ##         //
// ##         if (newList) {
// ##             this.props.onSelectionsChanged(newList);
// ##             this.setState({currentManyToManyIdList: newList});
// ##         }
// ##     }
// ## }
// ## 
// ## class ManyToManyField extends preact.Component {
// ##     // unregistrables;
// ##     // k;
// ##     // firstPanelEl;
// ##     // relPageType;
// ##     /**
// ##      * @param {{field: PageTypeField; emitChanges: (setChanges: (pageToMutate: Page) => void) => void;}} props
// ##      */
// ##     constructor(props) {
// ##         super(props);
// ##         this.unregistrables = [];
// ##         if (props.field.dataType.type !== 'many-to-many')
// ##             throw new Error('Not implemented yet');
// ##         this.k = props.field.name; // e.g. 'categories'
// ##         this.firstPanelEl = preact.createRef();
// ##         this.state = {
// ##             currentManyToManyIdList: getManyToManyValue(selectCurrentPageDataBundle(store.getState()).page, this.k),
// ##             createCatPanelState: createCreateCatPanelStateState(),
// ##         };
// ##         this.unregistrables.push(observeStore(selectCurrentPageDataBundle, ({page}) => {
// ##             if (this.state.currentManyToManyIdList.toString() !== page[this.k].toString())
// ##                this.setState({currentManyToManyIdList: getManyToManyValue(page, this.k)});
// ##         }));
// ##         this.relPageType = api.getPageTypes().find(({name}) => name === props.field.dataType.rel);
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     componentWillUnmount() {
// ##         this.unregistrables.forEach(unreg => unreg());
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render({field}, {currentManyToManyIdList, createCatPanelState}) {
// ##         return <div class="pt-1">
// ##             <div class="anim-outer">
// ##                 <div class={ `fieldset${createCatPanelState.leftClass === '' ? ' pr-0' : ''}` }>
// ##                     <div class="form-label legend">{ __(field.friendlyName) }</div>
// ##                     <div class={ createCatPanelState.leftClass } ref={ this.firstPanelEl }>
// ##                         <div class="prop-widget-many-to-many">
// ##                             <ManyToManyItemSelector
// ##                                 curSelections={ currentManyToManyIdList }
// ##                                 onSelectionsChanged={ this.emitManyToManyIdSelectedOrUnselected.bind(this) }
// ##                                 relPageType={ this.relPageType }/>
// ##                         </div>
// ##                         <button onClick={ this.openCreateCategoryPanel.bind(this) }
// ##                             class="btn btn-sm text-tiny with-icon-inline mt-2" type="button">
// ##                             <Icon iconId="plus" className="size-xs mr-1"/> { __('Add new %s', __('category')) }
// ##                         </button>
// ##                     </div>
// ##                     <AddCategoryPanel
// ##                         pageType={ this.relPageType }
// ##                         cssClass={ createCatPanelState.rightClass }
// ##                         onAddingFinished={ newCategoryPostData => {
// ##                             this.setState({createCatPanelState: createCreateCatPanelStateState('reveal-from-left', 'fade-to-right', false)});
// ##                             if (newCategoryPostData)
// ##                                 // todo check if page with identical slug already exist
// ##                                 store2.dispatch('pagesListings/addItem', [createCompactPageFrom(newCategoryPostData), this.relPageType.name]);
// ##                         } }
// ##                         panelHeight={ createCatPanelState.leftClass === ''
// ##                             ? 0
// ##                             : this.firstPanelEl.current.getBoundingClientRect().height
// ##                         }/>
// ##                 </div>
// ##             </div>
// ##         </div>;
// ##     }
// ##     /**
// ##      * @param {Array<String>} newManyToManyIdList
// ##      * @access private
// ##      */
// ##     emitManyToManyIdSelectedOrUnselected(newManyToManyIdList) {
// ##         this.props.emitChanges(mut => {
// ##             mut[this.k] = newManyToManyIdList;
// ##         });
// ##     }
// ##     /**
// ##      * @access private
// ##      */
// ##     openCreateCategoryPanel() {
// ##         this.setState({createCatPanelState: createCreateCatPanelStateState(
// ##             'fade-to-left',
// ##             'reveal-from-right',
// ##             true
// ##         )});
// ##     }
// ## }
// ## 
// ## /**
// ##  * @param {{[key: String]: any;}} from
// ##  * @returns {RelPage}
// ##  */
// ## function createCompactPageFrom(from) {
// ##     return {id: from.id, title: from.title, slug: from.slug, path: from.path};
// ## }
// ## 
// ## /**
// ##  * @param {Page} from
// ##  * @param {String} propName
// ##  * @returns {Array<String>}
// ##  */
// ## function getManyToManyValue(from, propName) {
// ##     return from[propName].slice(0);
// ## }
// ## 
// ## /**
// ##  * @param {String} leftClass = ''
// ##  * @param {String} rightClass = ''
// ##  * @returns {{leftClass: String; rightClass: String;}}
// ##  */
// ## function createCreateCatPanelStateState(leftClass = '', rightClass = '') {
// ##     return {leftClass, rightClass};
// ## }
// ## 
// ## export default ManyToManyField;
// ## export {ManyToManyItemSelector};
