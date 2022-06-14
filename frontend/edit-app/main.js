import {translator, api, env, urlUtils, signals} from '@sivujetti-commons-for-edit-app';
import {Validator} from './src/commons/Form.jsx';
import {sensibleDefaults} from './src/constants.js';
import store, {FormStateStoreWrapper, observeStore, createSelectBlockTree} from './src/store.js';
import EditApp from './src/EditApp.jsx';
import BlockTypes from './src/block-types/block-types.js';
import createMenuBlockType from './src/block-types/Menu/menu.js';
import createButtonBlockType from './src/block-types/button.js';
import createColumnsBlockType from './src/block-types/columns.js';
import createGlobalBlockReferenceBlockType from './src/block-types/globalBlockReference.js';
import createHeadingBlockType from './src/block-types/heading.js';
import createImageBlockType from './src/block-types/image.js';
import createListingBlockType from './src/block-types/Listing/listing.js';
import createPageInfoBlockType from './src/block-types/pageInfo.js';
import createParagraphBlockType from './src/block-types/paragraph.js';
import createRichTextBlockType from './src/block-types/richText.js';
import createSectionBlockType from './src/block-types/section.js';
import InspectorPanel from './src/InspectorPanel.jsx';
import blockTreeUtils from './src/blockTreeUtils.js';
import WebPageIframe from './src/WebPageIframe.js';
import MainPanel from './src/MainPanel.js';
import OnThisPageSection from './src/DefaultView/OnThisPageSection.jsx';
import GlobalStylesSection from './src/DefaultView/GlobalStylesSection.jsx';
import WebsiteSection from './src/DefaultView/WebsiteSection.jsx';

const editAppReactRef = preact.createRef();

populateFrontendApi();
configureServices();
renderReactEditApp();
hookUpSiteIframeUrlMirrorer();

function populateFrontendApi() {
    const d = window.dataFromAdminBackend;
    api.getPageTypes = () => d.pageTypes;
    api.getBlockRenderers = () => d.blockRenderers;
    api.getActiveTheme = () => d.activeTheme;
    api.user = { can(doWhat) {
        return d.userPermissions[`can${capitalize(doWhat)}`] === true;
    } };
    api.registerTranslationStrings = translator.addStrings.bind(translator);
    api.webPageIframe = new WebPageIframe(document.getElementById('sivujetti-site-iframe'), env, urlUtils);
    // blockTypes, see configureServices
    // mainPanel see configureServices
}

function configureServices() {
    env.normalTypingDebounceMillis = sensibleDefaults.normalTypingDebounceMillis;
    //
    Validator.registerStateWrapperImpl('default', FormStateStoreWrapper);
    window.translationStringBundles.forEach(strings => {
        api.registerTranslationStrings(strings);
        if (strings.minLength) Validator.setValidationStrings(strings);
    });
    //
    const blockTypes = new BlockTypes(api);
    // @featureFlagConditionUseReduxBlockTree
    const maybeDisableEdit = orig => !window.useReduxBlockTree ? orig : function (...args) {
        const out = orig(...args);
        out.editForm = class extends preact.Component {
            render() { return 'Not supported yet'; }
        };
        return out;
    };
    blockTypes.register('Menu', maybeDisableEdit(createMenuBlockType));
    blockTypes.register('Button', maybeDisableEdit(createButtonBlockType));
    blockTypes.register('Columns', createColumnsBlockType);
    blockTypes.register('GlobalBlockReference', maybeDisableEdit(createGlobalBlockReferenceBlockType));
    blockTypes.register('Heading', maybeDisableEdit(createHeadingBlockType));
    blockTypes.register('Image', maybeDisableEdit(createImageBlockType));
    blockTypes.register('Listing', maybeDisableEdit(createListingBlockType));
    blockTypes.register('PageInfo', maybeDisableEdit(createPageInfoBlockType));
    blockTypes.register('Paragraph', createParagraphBlockType);
    blockTypes.register('RichText', maybeDisableEdit(createRichTextBlockType));
    blockTypes.register('Section', createSectionBlockType);
    api.blockTypes = blockTypes;
    //
    const mainPanel = new MainPanel(document.getElementById('main-panel'),
        signals, env);
    mainPanel.registerSection('onThisPage', OnThisPageSection);
    if (api.user.can('editThemeStyles')) {
        mainPanel.registerSection('globalStyles', GlobalStylesSection);
    }
    if (api.user.can('createPages')) {
        mainPanel.registerSection('website', WebsiteSection);
    }
    api.mainPanel = mainPanel;
    //
    patchQuillEditor();
}

function patchQuillEditor() {
    const Quill = window.Quill;
    Quill.debug('error');
    //
    const Clipboard = Quill.import('modules/clipboard');
    const Delta = Quill.import('delta');
    class PlainClipboard extends Clipboard {
        onPaste(e) {
            // https://github.com/quilljs/quill/blob/d462f8000ffbaa3aab853809fb08f7809f828475/modules/clipboard.js#L178
            if (e.defaultPrevented || !this.quill.isEnabled()) return;
            e.preventDefault();
            const range = this.quill.getSelection(true);
            if (range == null) return;
            // https://github.com/quilljs/quill/issues/1298#issuecomment-403657657
            const text = e.clipboardData.getData('text/plain');
            const delta = new Delta()
                .retain(range.index)
                .delete(range.length)
                .insert(text);
            const index = text.length + range.index;
            const length = 0;
            this.quill.updateContents(delta, Quill.sources.USER);
            this.quill.setSelection(index, length, Quill.sources.SILENT);
            this.quill.scrollIntoView();
        }
    }
    Quill.register('modules/clipboard', PlainClipboard);
    //
    const Keyboard = Quill.import('modules/keyboard');
    class CustomKeyboard extends Keyboard { }
    CustomKeyboard.DEFAULTS = Object.assign({}, Keyboard.DEFAULTS, {
        bindings: Object.assign({}, Keyboard.DEFAULTS.bindings, {
            ['list autofill']: undefined
        })
    });
    Quill.register('modules/keyboard', CustomKeyboard);
    //
    // https://codepen.io/anon/pen/GNMXZa
    const Link = Quill.import('formats/link');
    class CustomLink extends Link {
        static create(value) {
            const node = super.create(value);
            if (node.host === env.window.location.host) {
                node.removeAttribute('rel');
                node.removeAttribute('target');
            }
            return node;
        }
        static sanitize(url) {
            if (url.startsWith(urlUtils.baseUrl))
                return super.sanitize(url);
            return super.sanitize(url.indexOf('.') < 0
                ? urlUtils.makeUrl(url)
                : `${url.startsWith('//') || url.startsWith('http') ? '' : '//'}${url}`);
        }
    }
    Quill.register(CustomLink);
}

function renderReactEditApp() {
    const mainPanelOuterEl = api.mainPanel.getEl();
    const inspectorPanelOuterEl = document.getElementById('inspector-panel');
    const inspectorPanelReactRef = preact.createRef();
    const rootEl = document.getElementById('root');
    preact.render(preact.createElement(EditApp, {
        outerEl: mainPanelOuterEl,
        inspectorPanelRef: inspectorPanelReactRef,
        dataFromAdminBackend: window.dataFromAdminBackend,
        rootEl,
        ref: editAppReactRef,
    }), mainPanelOuterEl);

    preact.render(preact.createElement(InspectorPanel, {
        outerEl: inspectorPanelOuterEl,
        mainPanelOuterEl,
        rootEl,
        ref: inspectorPanelReactRef,
    }), inspectorPanelOuterEl);

    window.editApp = {
        /**
         * @param {EditAppAwareWebPage} webPage
         * @access public
         */
        handleWebPageLoaded(webPage) {
            const editApp = editAppReactRef.current;
            //
            const featureFlagConditionUseReduxBlockTree = window.useReduxBlockTree;
            const blockRefs = webPage.scanBlockRefComments(featureFlagConditionUseReduxBlockTree);
            const ordered = webPage.getCombinedAndOrderedBlockTree(webPage.data.page.blocks,
                                                                   blockRefs,
                                                                   blockTreeUtils);
            let trees = null;
            if (featureFlagConditionUseReduxBlockTree) {
                trees = new Map;
                if (window.currentBlockTreeCmp) {
                    window.currentBlockTreeCmp.componentWillUnmount();
                }

                const clone = JSON.parse(JSON.stringify(ordered));

                //
                const [mutatedClone, separatedTrees] = separate(clone);

                trees.set('main', mutatedClone);
                for (const [trid, tree] of separatedTrees) {
                    blockTreeUtils.traverseRecursively(tree, b => {
                        b.isStoredTo = 'globalBlockTree';
                        b.isStoredToTreeId = trid;
                    });
                    trees.set(trid, tree);
                }

                for (const [_, tree] of trees) {
                    blockTreeUtils.traverseRecursively(tree, b => {
                        if (['Columns', 'Paragraph', 'Section'].indexOf(b.type) > -1 || b.type === 'GlobalBlockReference') return;
                        wipe(b);
                    });
                }
            }

            const filtered = !webPage.data.page.isPlaceholderPage
                // Accept all
                ? blockRefs
                // Only if page block
                : blockRefs.filter(({blockId}) => blockTreeUtils.findBlock(blockId, webPage.data.page.blocks)[0] !== null);
            webPage.registerEventHandlers(editApp.websiteEventHandlers, filtered);
            editApp.handleWebPageLoaded(webPage, ordered, blockRefs, trees);
            if (featureFlagConditionUseReduxBlockTree) {
                const getTree = trid => createSelectBlockTree(trid)(store.getState()).tree;
                for (const [trid, _] of trees) {
                    const fn = webPage.createBlockTreeChangeListener(trid, blockTreeUtils, api.blockTypes, getTree);
                    observeStore(createSelectBlockTree(trid), fn);
                }
            }
        }
    };
}

/**
 * @param {Array<RawBlock>} mainTreeBlocks
 * @returns {[Array<RawBlock>, Map<String, Array<RawBlock>>]}
 */
function separate(mainTreeBlocks) {
    const separatedGlobalTreesBlocks = new Map;
    blockTreeUtils.traverseRecursively(mainTreeBlocks, b => {
        if (b.type !== 'GlobalBlockReference') return;
        separatedGlobalTreesBlocks.set(b.globalBlockTreeId, b.__globalBlockTree.blocks);
        delete b.__globalBlockTree.blocks;
    });
    return [mainTreeBlocks, separatedGlobalTreesBlocks];
}

function hookUpSiteIframeUrlMirrorer() {
    api.webPageIframe.getEl().addEventListener('load', e => {
        let p = e.target.contentWindow.location.href.split('#')[0]
            .replace('&in-edit', '')
            .replace('?in-edit', '')
            .replace(e.target.contentWindow.origin, '')
            .replace(urlUtils.baseUrl, `${urlUtils.baseUrl}_edit/`);
        p = (!p.endsWith('/') ? p : p.substr(0, p.length - 1)) + window.location.hash;
        if (window.location.href !== `${window.location.origin}${p}`)
            history.replaceState(null, null, p);
    });
}

function capitalize(str) {
    return `${str.charAt(0).toUpperCase()}${str.substring(1, str.length)}`;
}

function wipe(block) {
    for (const key in block) {
        if (!Object.prototype.hasOwnProperty.call(block, key)) continue;
        if (['id', 'type', 'isStoredTo', 'isStoredToTreeId', 'children'].indexOf(key) > -1) continue;
        else delete block[key];
    }
    block.__wiped = true;
}
