import {__, api, http, env, floatingDialog, urlUtils, Icon} from '@sivujetti-commons-for-edit-app';
import toasters from '../commons/Toaster.jsx';
import store, {deleteItemsFromOpQueueAfter, observeStore, selectOpQueue, setOpQueue} from '../store.js';
import store2 from '../store2.js';
import OnThisPageSection from './default-panel-sections/OnThisPageSection.jsx';
import BasicInfoConfigurationForm from './PageType/PageTypeBasicInfoConfigurationForm.jsx';
import OwnFieldsConfigurationForm from './PageType/PageTypeOwnFieldsConfigurationForm.jsx';

/**
 * Left-panel for #/page-types/create.
 */
class PageTypeCreatePanel extends preact.Component {
    // pageType;
    // basicInfoWorkingCopy;
    // lastCommittedName;
    // fieldsWorkingCopy;
    // formWasSubmitted;
    constructor(props) {
        super(props);
        this.state = {layouts: [], sectionBIsCollapsed: false, sectionCIsCollapsed: false};
        http.get('/api/layouts')
            .then(layouts => { this.setState({layouts}); })
            .catch(env.window.console.error);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        if (floatingDialog.close)
            floatingDialog.close();
        // todo prevent double
        createPlaceholderPageType()
            .then(pageType => {
                if (!pageType) { toasters.editAppMain(__('Something unexpected happened.'), 'error'); return; }
                api.getPageTypes().push(pageType);
                //
                api.webPageIframe.renderPlaceholderPage(pageType.name, pageType.defaultLayoutId).then(_webPage => {
                    this.setState({temp: ':pseudo/new-page-type'});
                    this.pageType = api.getPageTypes().find(({name}) => name === pageType.name);
                    this.doInit();
                });
            });
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.formWasSubmitted = false;
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        if (this.formWasSubmitted) return;
        store.dispatch(deleteItemsFromOpQueueAfter('create-new-page-type'));
        http.delete(`/api/page-types/${this.lastCommittedName}/as-placeholder`)
            .then(resp => { if (resp.ok !== 'ok') throw new Error('-'); })
            .catch(env.window.console.error);
    }
    /**
     * @access protected
     */
    render(_, {temp, layouts, sectionBIsCollapsed, sectionCIsCollapsed}) {
        return <div>
            <header class="panel-section pb-0">
                <h1 class="mb-2">{ __('Create %s', __('page type')) }</h1>
                <button
                    onClick={ () => preactRouter.route('/') }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel create %s', __('page type')) }
                    type="button">&lt; { __('Back') }</button>
            </header>
            { temp
                ? <OnThisPageSection loadedPageSlug={ temp }/>
                : null
            }
            <section class={ `on-this-page panel-section pl-0${sectionBIsCollapsed ? '' : ' open'}` }>
                <button
                    class="flex-centered pr-2 pl-1 section-title col-12"
                    onClick={ () => this.toggleIsCollapsed('sectionBIsCollapsed') }
                    type="button">
                    <Icon iconId="pencil" className="p-absolute size-sm mr-2 color-blue"/>
                    <span class="pl-1 d-block col-12 color-default">
                        { __('Settings') }
                        <span class="text-ellipsis text-tiny col-12">{ __('Uuden sivutyypin perustiedot') }</span>
                    </span>
                    <Icon iconId="chevron-right" className="p-absolute size-xs"/>
                </button>
                { temp ? <BasicInfoConfigurationForm
                    data={ this.basicInfoWorkingCopy }
                    onPropChanged={ (key, val) => {
                        this.basicInfoWorkingCopy = Object.assign({},
                            this.basicInfoWorkingCopy, {[key]: val}); }
                    }
                    layouts={ layouts }/> : null }
            </section>
            <section class={ `on-this-page panel-section pl-0${sectionCIsCollapsed ? '' : ' open'}` }>
                <button
                    class="flex-centered pr-2 pl-1 section-title col-12"
                    onClick={ () => this.toggleIsCollapsed('sectionCIsCollapsed') }
                    type="button">
                    <Icon iconId="layout-list" className="p-absolute size-sm mr-2 color-orange"/>
                    <span class="pl-1 d-block col-12 color-default">
                        { __('Fields') }
                        <span class="text-ellipsis text-tiny col-12">{ __('Uuden sivutyypin omat kentät') }</span>
                    </span>
                    <Icon iconId="chevron-right" className="p-absolute size-xs"/>
                </button>
                { temp ? <OwnFieldsConfigurationForm
                    fields={ this.fieldsWorkingCopy }
                    onFieldsChanged={ newFields => { this.fieldsWorkingCopy = newFields.map(f => Object.assign({}, f)); } }/> : null }
            </section>
        </div>;
    }
    /**
     * @access private
     */
    doInit() {
        this.basicInfoWorkingCopy = {
            name: undefined,
            friendlyName: undefined,
            friendlyNamePlural: undefined,
            description: undefined,
            slug: undefined,
            defaultLayoutId: this.pageType.defaultLayoutId,
            status: this.pageType.status,
            isListable: this.pageType.isListable,
        };
        this.lastCommittedName = this.pageType.name;
        this.fieldsWorkingCopy = this.pageType.ownFields.map(f => Object.assign({}, f));
        store.dispatch(setOpQueue([{opName: 'create-new-page-type', command: {
            doHandle: () => {
                const unreg = observeStore(selectOpQueue, queue => {
                    if (queue.length !== 0) return;
                    this.onOpQueueTasksFinished(this.submitData);
                    unreg();
                });
                return this.postNewPageTypeToBackend();
            },
            args: []
        }}]));
    }
    /**
     * @returns {Promise<Boolean>}
     * @access private
     */
    postNewPageTypeToBackend() {
        const l = this.state.layouts.find(({id}) => id === this.basicInfoWorkingCopy.defaultLayoutId);
        // {name, friendlyName ...}
        const data = Object.assign({}, this.basicInfoWorkingCopy);
        if (!data.description) data.description = '';
        const belongsToLayout = b => b.type === 'PageInfo' ||
            (b.type === 'GlobalBlockReference' && l.structure.some(p =>
                p.type === 'globalBlockTree' &&
                p.globalBlockTreeId === b.globalBlockTreeId
            ));
        data.blockFields = store2.get().theBlockTree.filter(b => !belongsToLayout(b));
        data.defaultFields = this.pageType.defaultFields;
        data.ownFields = this.fieldsWorkingCopy;
        //
        this.formWasSubmitted = true;
        return http.put(`/api/page-types/${this.lastCommittedName}`, data)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                this.submitData = data;
                return true;
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
                return false;
            });
    }
    /**
     * @param {PageType} submittedData
     * @access private
     */
    onOpQueueTasksFinished(submittedData) {
        const mutRef = this.pageType;
        Object.assign(mutRef, submittedData);
        toasters.editAppMain(`${__('Created new %s', __('page type'))}.`, 'success');
        urlUtils.redirect('/_edit');
    }
    /**
     * @param {'sectionCIsCollapsed'|'sectionBIsCollapsed'} e
     * @access private
     */
    toggleIsCollapsed(prop) {
        this.setState({[prop]: !this.state[prop]});
    }
}

/**
 * @returns {Promise<PageType|null>}
 */
function createPlaceholderPageType() {
    return http.post('/api/page-types/as-placeholder', {dum: 'my'})
        .then(resp => {
            if (resp.ok !== 'ok') throw new Error('-');
            return resp.newEntity;
        })
        .catch(err => {
            window.console.error(err);
            return null;
        });
}

export default PageTypeCreatePanel;
