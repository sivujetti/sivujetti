import {__, api, env, makePath, makeSlug, objectUtils} from '@sivujetti-commons-for-edit-app';
import {treeToTransferable} from '../../includes/block/utils.js';
import {createTrier, generatePushID, pathToFullSlug} from '../../includes/utils.js';
import DnDBlockSpawner from '../block/DnDBlockSpawner.jsx';
import BaseStylesSection from '../default-state-sections/BaseStylesSection.jsx';
import OnThisPageSection from '../default-state-sections/OnThisPageSection.jsx';

const STATUS_PUBLISHED = 0;

/**
 * Main column state for #/pages/create/:pageTypeName?/:layoutId?[?addToMenu='menuBlockId:menuBlockIsStoredToTreeId:pageSlug'].
 */
class PageCreateState extends preact.Component {
    // unregistrables;
    // blockSpawner;
    // pageType;
    // addToMenuIdInfo;
    // savePageToBackendResult;
    // addToMenuIsInCurrentPage;
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregistrables = [];
        this.blockSpawner = preact.createRef();
        const pageTypeName = this.props.pageTypeName || 'Pages';
        this.pageType = api.getPageTypes().find(({name}) => name === pageTypeName);
        const triplet = this.props.matches.addToMenu;
        this.addToMenuIdInfo = !triplet ? null: triplet.split(':').map(input => input.replace(/[^a-zA-Z0-9_/-]/g, ''));
        // Push new page to 'currentPageDataBundle'
        api.webPagePreview.onReady(() => { // make sure currentPageDataBundle is loaded
            const saveButton = api.saveButton.getInstance();
            const pageDataBundleStateWithNewPage = createNewPage(this.props.url.indexOf('/duplicate') > '/pages/'.length);
            saveButton.pushOp(
                'currentPageDataBundle',
                pageDataBundleStateWithNewPage,
                {event: 'create'}
            );
            this.unregistrables.push(saveButton.onAfterItemsSynced(() => {
                const {path} = saveButton.getChannelState('currentPageDataBundle').page;
                const newPagePath = pathToFullSlug(path, '');
                env.window.myRoute(newPagePath);
            }));
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
    render(_, {url}) {
        const nameTrans = __(this.pageType.friendlyName).toLowerCase();
        const SupportSection = url ? api.menuPanel.getSection('plugin:sjorgSupportClient', false) : null;
        return [
            <header class="panel-section pb-0">
                <h1 class="mb-2">{ __('Create %s', nameTrans) }</h1>
                <button
                    onClick={ () => preactRouter.route('/') }
                    class="btn btn-link btn-sm"
                    title={ __('Cancel create %s', nameTrans) }
                    type="button">&lt; { __('Back') }</button>
            </header>,
            <DnDBlockSpawner initiallyIsOpen ref={ this.blockSpawner }/>,
            <div id="edit-app-sections-wrapper">
                <OnThisPageSection currentPageSlug={ url }
                    ref={ cmp => {
                        if (cmp && !this.isMainDndInited) {
                            this.isMainDndInited = 1;
                            createTrier(() => {
                                const allSet = !!this.blockSpawner.current && !!cmp.blockTreeRef.current?.dragDrop;
                                if (allSet)
                                    this.blockSpawner.current.setMainTreeDnd(cmp.blockTreeRef.current.dragDrop);
                                return allSet;
                            }, 20, 20)();
                        }
                    } }/>
                { [
                    api.user.can('editGlobalStylesVisually')
                        ? <BaseStylesSection/>
                        : null, // User has no permission to edit styles
                    SupportSection
                        ? <SupportSection/>
                        : null
                ] }
            </div>
        ];
    }
}

/**
 * @param {Boolean} isDuplicated
 * @returns {Page}
 */
function createNewPage(isDuplicated) {
    const saveButton = api.saveButton.getInstance();
    const initial = saveButton.getChannelState('currentPageDataBundle');
    const placeholderPage = initial.page;
    const title = __(placeholderPage.title) + (!isDuplicated ? '' : ` (${__('Copy')})`);
    const slug = makeSlug(title);
    return objectUtils.cloneDeep({
        ...initial,
        ...{page: {
            ...placeholderPage,
            ...{
                id: generatePushID(),
                title,
                slug,
                path: makePath(slug, api.getPageTypes().find(({name}) => name === placeholderPage.type)),
                blocks: treeToTransferable(saveButton.getChannelState('theBlockTree')),
                status: STATUS_PUBLISHED,
            },
        }}
    });
}

/**
 * @returns {PartialMenuLink}
 */
function createMenuLinkFromNewestData() {
    const {page} = api.saveButton.getInstance().getChannelState('currentPageDataBundle');
    return {slug: pathToFullSlug(page.path), text: page.title};
}

/**
 * @param {{[key: String]: any;}} obj
 * @returns {Boolean}
 */
function isPage(obj) {
    return typeof obj.slug === 'string' && typeof obj.path === 'string';
}

export default PageCreateState;
