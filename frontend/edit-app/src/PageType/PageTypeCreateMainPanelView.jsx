import {__, http, env} from '@sivujetti-commons-for-edit-app';
import Icon from '../commons/Icon.jsx';
import toasters from '../commons/Toaster.jsx';
import BlockTrees from '../BlockTrees.jsx';
import store, {deleteItemsFromOpQueueAfter, setOpQueue} from '../store.js';
import PageTypeBasicInfoConfigurationForm from './PageTypeBasicInfoConfigurationForm.jsx';
import PageTypeOwnFieldsConfigurationForm from './PageTypeOwnFieldsConfigurationForm.jsx';

class PageTypeCreateMainPanelView extends preact.Component {
    // basicInfoWorkingCopy;
    // fieldsWorkingCopy;
    // formWasSubmitted;
    // lastCommittedPageName;
    /**
     * Note to self: getLayouts is for tests.
     *
     * @param {{cancelAddPageType: () => void; pageType: PageType; blockTreesRef: preact.Ref; getLayouts?: () => Promise<Array<Layout>>;}} props
     */
    constructor(props) {
        super(props);
        this.basicInfoWorkingCopy = {
            name: undefined,
            friendlyName: undefined,
            friendlyNamePlural: undefined,
            description: undefined,
            slug: undefined,
            defaultLayoutId: props.pageType.defaultLayoutId,
            status: props.pageType.status,
            isListable: props.pageType.isListable,
        };
        this.lastCommittedName = props.pageType.name;
        this.fieldsWorkingCopy = props.pageType.ownFields.map(f => Object.assign({}, f));
        this.state = {layouts: [], sectionAIsCollapsed: false,
            sectionBIsCollapsed: false, sectionCIsCollapsed: false};
        (props.getLayouts ? props.getLayouts() : http.get('/api/layouts'))
            .then(layouts => { this.setState({layouts}); })
            .catch(env.window.console.error);
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.formWasSubmitted = false;
        store.dispatch(setOpQueue([{opName: 'create-new-page-type', command: {
            doHandle: this.handleFormSubmitted.bind(this),
            args: []
        }}]));
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
    render({cancelAddPageType, blockTreesRef},
           {layouts, sectionAIsCollapsed, sectionBIsCollapsed, sectionCIsCollapsed}) {
        return <form onSubmit={ this.handleFormSubmitted.bind(this) }>
            <header class="panel-section mb-0">
                <h1 class="mb-2">{ __('Create %s', __('page type')) }</h1>
                <button
                    onClick={ cancelAddPageType }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel add %s', __('page type')) }
                    type="button">&lt; { __('Back') }</button>
            </header>
            <section class={ `pt-0 panel-section${sectionAIsCollapsed ? '' : ' open'}` }>
                <button class="d-flex col-12 flex-centered pr-2" onClick={ () => this.toggleIsCollapsed('sectionAIsCollapsed') } type="button">
                    <Icon iconId="star" className="size-sm mr-2 color-purple"/>
                    <span class="flex-centered">
                        <span class="pl-1 color-default mr-1">{ __('Default content') }</span>
                        <span class="tooltip tooltip-bottom" data-tooltip={ `Oletussisältö joka näytetään aluksi\nkun luot tämän tyyppisiä\nsivuja` }>
                            <Icon iconId="info-circle" className="size-xs"/>
                        </span>
                    </span>
                    <Icon iconId="chevron-right" className="col-ml-auto size-xs"/>
                </button>
                <BlockTrees
                    containingView="CreatePageType"
                    ref={ blockTreesRef }/>
            </section>
            <section class={ `panel-section${sectionCIsCollapsed ? '' : ' open'}` }>
                <button class="d-flex col-12 flex-centered pr-2" onClick={ () => this.toggleIsCollapsed('sectionCIsCollapsed') } type="button">
                    <Icon iconId="pencil" className="size-sm mr-2 color-blue"/> { /* todo */ }
                    <span class="pl-1 color-default">{ __('Settings') }</span>
                    <Icon iconId="chevron-right" className="col-ml-auto size-xs"/>
                </button>
                <PageTypeBasicInfoConfigurationForm
                    data={ this.basicInfoWorkingCopy }
                    onPropChanged={ (key, val) => {
                        this.basicInfoWorkingCopy = Object.assign({},
                            this.basicInfoWorkingCopy, {[key]: val}); }
                    }
                    layouts={ layouts }/>
            </section>
            <section class={ `panel-section${sectionBIsCollapsed ? '' : ' open'}` }>
                <button class="d-flex col-12 flex-centered pr-2" onClick={ () => this.toggleIsCollapsed('sectionBIsCollapsed') } type="button">
                    <Icon iconId="layout-list" className="size-sm mr-2 color-orange"/>
                    <span class="flex-centered">
                        <span class="pl-1 color-default mr-1">{ __('Fields') }</span>
                        <span class="tooltip" data-tooltip={ `Tämän sivutyypin omat kentät\ntodo` }>
                            <Icon iconId="info-circle" className="size-xs"/>
                        </span>
                    </span>
                    <Icon iconId="chevron-right" className="col-ml-auto size-xs"/>
                </button>
                <PageTypeOwnFieldsConfigurationForm
                    fields={ this.fieldsWorkingCopy }
                    onFieldsChanged={ newFields => { this.fieldsWorkingCopy = newFields.map(f => Object.assign({}, f)); } }/>
            </section>
        </form>;
    }
    /**
     * @param {'sectionAIsCollapsed'|'sectionBIsCollapsed'|'sectionCIsCollapsed'} e
     * @access private
     */
    toggleIsCollapsed(prop) {
        this.setState({[prop]: !this.state[prop]});
    }
    /**
     * @param {Event|undefined} e
     * @returns {Promise<Boolean>}
     * @access private
     */
    handleFormSubmitted(e) {
        if (e) e.preventDefault();
        const l = this.state.layouts.find(({id}) => id === this.basicInfoWorkingCopy.defaultLayoutId);
        // {name, friendlyName ...}
        const data = Object.assign({}, this.basicInfoWorkingCopy);
        if (!data.description) data.description = '';
        const belongsToLayout = b => b.type === 'PageInfo' ||
            (b.type === 'GlobalBlockReference' && l.structure.some(p =>
                p.type === 'globalBlockTree' &&
                p.globalBlockTreeId === b.globalBlockTreeId
            ));
        data.blockFields = this.props.blockTreesRef.current.getPageBlocks().filter(b => !belongsToLayout(b));
        data.defaultFields = this.props.pageType.defaultFields;
        data.ownFields = this.fieldsWorkingCopy;
        //
        this.formWasSubmitted = true;
        return http.put(`/api/page-types/${this.lastCommittedName}`, data)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                this.props.onPageTypeCreated(data);
                return true;
            })
            .catch(err => {
                window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
                return false;
            });
    }
}

/**
 * @returns {Promise<PageType|null>}
 */
function createPlaceholderPageType() {
    return http.post(`/api/page-types/as-placeholder`, {dum: 'my'})
        .then(resp => {
            if (resp.ok !== 'ok') throw new Error('-');
            return resp.newEntity;
        })
        .catch(err => {
            window.console.error(err);
            return null;
        });
}

export {createPlaceholderPageType};

export default PageTypeCreateMainPanelView;
