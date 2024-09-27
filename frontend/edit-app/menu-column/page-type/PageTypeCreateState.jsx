import {
    __,
    api,
    MenuSection,
    objectUtils,
    urlUtils,
} from '@sivujetti-commons-for-edit-app';
import {blockToBlueprint} from '../block/BlockTreeFuncs.js';
import OnThisPageSection from '../default-state-sections/OnThisPageSection.jsx';
import BasicInfoConfigForm from './BasicInfoConfigForm.jsx';
import OwnFieldsConfigForm from './OwnFieldsConfigForm.jsx';

const PAGETYPE_STATUS_COMPLETE = 0;
const PAGETYPE_STATUS_DRAFT = 1;

/**
 * Menu column state for #/page-types/create.
 */
class PageTypeCreateState extends preact.Component {
    // unregistrables;
    // basicInfoForm;
    // ownFieldsForm;
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregistrables = [];
        this.basicInfoForm = preact.createRef();
        this.ownFieldsForm = preact.createRef();
        api.webPagePreview.onReady(() => { // make sure currentPageData is loaded
            const saveButton = api.saveButton.getInstance();
            const syncedPageTypes = api.getPageTypes();
            saveButton.initChannel('pageTypes', syncedPageTypes);
            const withNewPageType = [...objectUtils.cloneDeep(syncedPageTypes), {
                name: '',
                friendlyName: '',
                friendlyNamePlural: '',
                description: '',
                slug: '',
                blockBlueprintFields: [], // see createAddPageTypeSaveOpFilter()
                ownFields: [{
                    name: 'field1',
                    friendlyName: 'Field 1',
                    dataType: {
                        type: 'text',
                        isNullable: false,
                        length: null,
                        validationRules: null,
                    },
                    defaultValue: '',
                }],
                defaultFields: {title: {defaultValue: 'Title'}},
                defaultLayoutId: '1',
                status: PAGETYPE_STATUS_DRAFT,
                isListable: true,
            }];
            saveButton.pushOp('pageTypes', withNewPageType, {event: 'create'});

            this.unregistrables.push(saveButton.registerSyncQueueFilter((out, _activeStates) => {
                const basicInfo = this.basicInfoForm.current.getResult();
                const layout = this.basicInfoForm.current.state.layouts.find(({id}) => id === basicInfo.defaultLayoutId);
                const filter = createAddPageTypeSaveOpFilter({
                    // name, slug etc.
                    ...basicInfo,
                    ownFields: this.ownFieldsForm.current.getResult(),
                }, layout);
                return filter(out, _activeStates);
            }));

            this.unregistrables.push(saveButton.onAfterItemsSynced(() => {
                urlUtils.redirect('/_edit&show-message=page-type-created', true);
            }));

            this.setState({ready: true});
        });
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
    render(_, {ready, sectionBIsCollapsed, sectionCIsCollapsed}) {
        const SupportSection = ready ? api.menuPanel.getSection('plugin:sjorgSupportClient', false) : null;
        return [
            <header class="panel-section pb-0">
                <h1 class="mb-2">{ __('Create %s', __('page type')) }</h1>
                <button
                    onClick={ () => preactRouter.route('/') }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel create %s', __('page type')) }
                    type="button">&lt; { __('Back') }</button>
            </header>,
            <main style="--header-height: 116px">
                <div id="edit-app-sections-wrapper">
                    <OnThisPageSection
                        currentPageSlug="/page-types/create"/>
                    <MenuSection
                        title={ __('Settings') }
                        subtitle={ __('Uuden sivutyypin perustiedot') }
                        iconId="pencil"
                        colorClass="color-blue"
                        initiallyIsCollapsed={ false }
                        onIsCollapsedChanged={ to => this.setState({sectionBIsCollapsed: to}) }>
                        { ready
                            ? <div class={ !sectionBIsCollapsed ? '' : 'd-none' }>
                                <BasicInfoConfigForm ref={ this.basicInfoForm }/>
                            </div>
                            : null
                        }
                    </MenuSection>
                    <MenuSection
                        title={ __('Fields') }
                        subtitle={ __('Uuden sivutyypin omat kentät') }
                        iconId="layout-list"
                        colorClass="color-orange"
                        initiallyIsCollapsed={ false }
                        onIsCollapsedChanged={ to => this.setState({sectionCIsCollapsed: to}) }>
                        { ready
                            ? <div class={ !sectionCIsCollapsed ? '' : 'd-none' }>
                                <OwnFieldsConfigForm ref={ this.ownFieldsForm }/>
                            </div>
                            : null
                        }
                    </MenuSection>
                    { SupportSection
                        ? <SupportSection/>
                        : null
                    }
                </div>
            </main>
        ];
    }
}

/**
 * Creates a function, that patches out.find(itm => itm.channelName === 'pageTypes' && itm.userCtx.event === 'create')
 * with form data $data, and transfers out.find(itm => itm.channelName === 'theBlockTree').latest to
 * its blockBlueprintFields prop.
 *
 * @param {PageType} data
 * @param {Layout} layout
 * @returns {(out: Array<StateHistory>, _activeStates: todo) => Promise<Array<StateHistory>|null>}
 */
function createAddPageTypeSaveOpFilter(data, layout) {
    /**
     * @param {Array<StateHistory>} out
     * @param {todo} _activeStates
     * @returns {Promise<Array<StateHistory>|null>}
     */
    return (out, _activeStates) => {
        const pageTypesHistory = out.find(({channelName}) => channelName === 'pageTypes');
        if (!pageTypesHistory) return null;

        const blockTreeHistory = out.find(({channelName}) => channelName === 'theBlockTree');
        const latestBlockTree = blockTreeHistory ? blockTreeHistory.latest : api.saveButton.getInstance().getChannelState('theBlockTree');
        // #1
        const l = pageTypesHistory.latest.length - 1;
        const belongsToLayout = createBelongsToLayout(layout);
        const out2 = out.map(itm => itm !== pageTypesHistory ? itm : {
            ...itm,
            latest: itm.latest.map((s, i2) => i2 !== l ? s : {
                ...s,
                ...data, // name, slug, etc..., ownFields
                status: PAGETYPE_STATUS_COMPLETE,
                defaultFields: {title: {defaultValue: __('New page')}},
                blockBlueprintFields: latestBlockTree
                    .filter(b => !belongsToLayout(b))
                    .map(b => blockToBlueprint(b)),
            })
        })
        // #2
        .filter(({channelName}) => channelName !== 'theBlockTree');

        return Promise.resolve(out2);
    };
}

/**
 * @param {Layout} layout
 * @returns {(block: Block) => boolean}
 */
function createBelongsToLayout({structure}) {
    return b => b.type === 'PageInfo' ||
        (b.type === 'GlobalBlockReference' && structure.some(p =>
            p.type === 'globalBlockTree' &&
            p.globalBlockTreeId === b.globalBlockTreeId
        ));
}

export default PageTypeCreateState;
