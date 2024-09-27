import {
    __,
    api,
    blockTreeUtils,
    env,
    generatePushID,
    makePath,
    makeSlug,
    objectUtils,
    scssWizard,
    traverseRecursively,
} from '@sivujetti-commons-for-edit-app';
import {treeToTransferable} from '../../includes/block/utils.js';
import {pathToFullSlug} from '../../includes/utils.js';
import BaseAndCustomClassStylesSection from '../default-state-sections/BaseStylesSection.jsx';
import OnThisPageSection from '../default-state-sections/OnThisPageSection.jsx';
import globalData from '../../includes/globalData.js';

const STATUS_PUBLISHED = 0;

/**
 * Menu column state for #/pages/create/:pageTypeName?/:layoutId?[?addToMenu='menuBlockId:menuBlockIsStoredToTreeId:pageSlug'].
 */
class PageCreateState extends preact.Component {
    // unregistrables;
    // pageType;
    // addToMenuIdInfo;
    // addToMenuIsInCurrentPage;
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregistrables = [];
        const pageTypeName = this.props.pageTypeName || 'Pages';
        this.pageType = api.getPageTypes().find(({name}) => name === pageTypeName);
        const triplet = this.props.matches.addToMenu;
        this.addToMenuIdInfo = !triplet ? null: triplet.split(':').map(input => input.replace(/[^a-zA-Z0-9_/-]/g, ''));
        // Push new page to 'currentPageData'
        api.webPagePreview.onReady(() => { // make sure currentPageData is loaded
            const saveButton = api.saveButton.getInstance();
            const [newPageData, maybePatchedBlockTree] = createNewCurrentPageData(this.props.url.indexOf('/duplicate') > '/pages/'.length);
            scssWizard.setCurrentPageInfo(newPageData);
            const {initialPageBlocksStyles} = globalData;
            saveButton.pushOpGroup(...[
                ['currentPageData', newPageData, {event: 'create'}],
                ...(!maybePatchedBlockTree
                    ? []
                    : [['theBlockTree', maybePatchedBlockTree, {event: 'patch-single-block-props'}]]),
                ...(!initialPageBlocksStyles.length
                    ? []
                    : [['stylesBundle', scssWizard.addManyNewChunksAndReturnAllRecompiled(initialPageBlocksStyles)]]),
            ]);
            this.unregistrables.push(saveButton.onAfterItemsSynced(() => {
                const {path} = saveButton.getChannelState('currentPageData');
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
            <main style="--header-height: 116px">
                <div id="edit-app-sections-wrapper">
                    <OnThisPageSection
                        currentPageSlug="/pages/create"/>
                    { [
                        api.user.can('editGlobalStylesVisually')
                            ? <BaseAndCustomClassStylesSection/>
                            : null, // User has no permission to edit styles
                        SupportSection
                            ? <SupportSection/>
                            : null
                    ] }
                </div>
            </main>
        ];
    }
}

/**
 * @param {boolean} isDuplicated
 * @returns {[Page, Array<Block>|null]}
 */
function createNewCurrentPageData(isDuplicated) {
    const saveButton = api.saveButton.getInstance();
    const placeholderPage = saveButton.getChannelState('currentPageData');
    const title = __(placeholderPage.title) + (!isDuplicated ? '' : ` (${__('Copy')})`);
    const slug = makeSlug(title);
    const blocks = saveButton.getChannelState('theBlockTree');
    const patchedBlocks = !isDuplicated ? null : blockTreeUtils.createMutation(blocks, newTreeCopy => {
        traverseRecursively(newTreeCopy, bRef => {
            bRef.id = generatePushID(true);
        });
        return newTreeCopy;
    });
    return [objectUtils.cloneDeep({
        ...placeholderPage,
        id: generatePushID(),
        title,
        slug,
        path: makePath(slug, api.getPageTypes().find(({name}) => name === placeholderPage.type)),
        blocks: treeToTransferable(patchedBlocks || blocks),
        status: STATUS_PUBLISHED,
    }), patchedBlocks];
}

/**
 * @returns {PartialMenuLink}
 */
function createMenuLinkFromNewestData() {
    const page = api.saveButton.getInstance().getChannelState('currentPageData');
    return {slug: pathToFullSlug(page.path), text: page.title};
}

/**
 * @param {{[key: string]: any;}} obj
 * @returns {boolean}
 */
function isPage(obj) {
    return typeof obj.slug === 'string' && typeof obj.path === 'string';
}

export default PageCreateState;
