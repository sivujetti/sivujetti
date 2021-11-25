import reactTestUtils, {blockUtils} from './my-test-utils.js';
import store, {observeStore, setCurrentPage, selectOpQueue} from '../edit-app/src/store.js';
import AddPageMainPanelView from '../edit-app/src/AddPageMainPanelView.jsx';
import BlockTrees from '../edit-app/src/BlockTrees.jsx';
import blockTypes from '../edit-app/src/block-types/block-types.js';
import InspectorPanel from '../edit-app/src/InspectorPanel.jsx';
import SaveButton from '../edit-app/src/SaveButton.jsx';
import blockTreeUtils from '../edit-app/src/blockTreeUtils.js';
import EditAppAwareWebPage from '../webpage/src/EditAppAwareWebPage.js';

const mockPageTypes = [{"name": "Pages", "ownFields": [],}];

const testBlocks = [{
    "type": "Paragraph",
    "title": "",
    "renderer": "sivujetti:block-auto",
    "id": 'EsmAW0--AnViMcwnIaDP',
    "children": [],
    "propsData": [
        {"key": "text", "value": "© Mysite"},
        {"key": "cssClass", "value": ""}
    ],
    "text": "© Mysite",
    "cssClass": ""
}];

function createTestState() {
    return {
        blockTreesCmp: null,
    };
}

class MockEditApp extends preact.Component {
    /**
     * @param {{view: 'DefaultView'|'AddPageView'; pref: preact.Ref; onPageLoaded?: () => void;}} props
     */
    render({view, pref, onPageLoaded}) {
        return <>
            <SaveButton/>
            { view === 'DefaultView'
                ? <BlockTrees
                    containingView="DefaultMainPanelView"
                    onWebPageLoadHandled={ onPageLoaded }
                    ref={ pref }/>
                : <AddPageMainPanelView
                    pageType={ mockPageTypes[0] }
                    ref={ pref }
                    blockTreesRef={ preact.createRef() }
                    getLayouts={ () => Promise.resolve([{id: '1', friendlyName: 'Default'}]) }
                    initialLayoutId="1"
                    noAutoFocus/>
            }
            <InspectorPanel rootEl={ document.getElementById('render-container-el') } outerEl={ document.getElementById('render-container-el') }/>
        </>;
    }
}

function renderMockEditAppIntoDom(view, then = null) {
    return new Promise(resolve => {
        if (view === 'DefaultView')
            reactTestUtils.renderIntoDocument(MockEditApp, {
                view,
                pref: cmp => { then(cmp); },
                onPageLoaded: () => { resolve(); }
            });
        else if (view === 'AddPageView')
            reactTestUtils.renderIntoDocument(MockEditApp, {
                view,
                pageType: mockPageTypes[0],
                pref: cmp => {
                    if (cmp) resolve(cmp);
                }
            });
        else
            throw new Error(`View (${view}) must be 'DefaultView', or 'AddPageView'`);
    });
}

function simulatePageLoad(_s, isNewPage = false, testBlocksBundle = 'default') {
    const pageBlocks = [{
        "type": "PageInfo",
        "title": "",
        "renderer": "sivujetti:block-auto",
        "id": "gBPJW0--vD-s3HsG3cu-",
        "propsData": [{"key": "overrides", "value": "[]"}],
        "children": [],
        "overrides": "[]",
        "parentBlockIdPath": "",
        "isStoredTo": "page"
    }, {
        "type": "Section",
        "title": "",
        "renderer": "sivujetti:block-generic-wrapper",
        "id": '-MfgGtK5pnuk1s0Kws4u',
        "propsData": [
            {"key": "bgImage", "value": ""},
            {"key": "cssClass", "value": "initial-section"}
        ],
        "bgImage": "",
        "cssClass": "initial-section",
        "children": [{
            "type": "Heading",
            "title": "",
            "renderer": "sivujetti:block-auto",
            "id": '-Me3jYWcEOlLTgJhzqL8',
            "children": testBlocksBundle === 'withNestedBlock' ? [{
                "type": "Paragraph",
                "title": "",
                "renderer": "sivujetti:block-auto",
                "id": '-MlOaY1tZtpkrwPbyuTW',
                "children": [],
                "propsData": [
                    {"key": "text", "value": "Sub text"},
                    {"key": "level", "value": 2},
                    {"key": "cssClass", "value": "subtitle"}
                ],
                "text": "Sub text",
                "level": 2,
                "cssClass": "subtitle"
            }] : [],
            "propsData": [
                {"key": "text", "value": "My page"},
                {"key": "level", "value": 2},
                {"key": "cssClass", "value": ""}
            ],
            "text": "My page",
            "level": 2,
            "cssClass": ""
        }, {
            "type": "Paragraph",
            "title": "",
            "renderer": "sivujetti:block-auto",
            "id": '-Me3jYWcEOlLTgJhzqLA',
            "children": [],
            "propsData": [
                {"key": "text", "value": "Hello"},
                {"key": "cssClass", "value": ""}
            ],
            "text": "Hello",
            "cssClass": ""
        }]
    }].concat(...(testBlocksBundle === 'withGlobalBlockReference' ? [{
        "type": "GlobalBlockReference",
        "title": "",
        "renderer": "sivujetti:block-auto",
        "id": "-MlPupIvfXCsi7eHeTP4",
        "propsData": [{"key": "globalBlockTreeId", "value": "10"},
                      {"key": "overrides", "value": ""}],
        "children": [],
        "globalBlockTreeId": "10",
        "overrides": "",
        "__globalBlockTree": {
            "id": "10",
            "name": "My stored",
            "blocks": testBlocks.slice(0),
        },
    }] : []));
    document.getElementById('mock-page-container-el').innerHTML =
        blockUtils.decorateWithRef(pageBlocks[0],
            '<!-- PageInfo dummy -->'
        ) +
        renderBlock(pageBlocks[1],
            renderBlock(pageBlocks[1].children[0],
                (testBlocksBundle === 'withNestedBlock'
                    ? renderBlock(pageBlocks[1].children[0].children[0])
                    : '')
            + '</h2>') +
            renderBlock(pageBlocks[1].children[1])
        ) +
        (testBlocksBundle === 'withGlobalBlockReference'
            ? blockUtils.decorateWithRef(pageBlocks[2],
                renderBlock(pageBlocks[2].__globalBlockTree.blocks[0],
            ))
            : '');
    //
    const mockSivujettiCurrentPageData = {
        page: {
            id: '1',
            title: 'Page',
            isPlaceholderPage: isNewPage,
            type: 'Pages',
            layoutId: '1',
            blocks: pageBlocks,
        },
        layouts: [],
    };
    const webPage = new EditAppAwareWebPage(mockSivujettiCurrentPageData);
    const blockRefs = webPage.scanBlockRefComments();
    const combinedBlockTree = webPage.getCombinedAndOrderedBlockTree(pageBlocks,
        blockRefs, blockTreeUtils);
    store.dispatch(setCurrentPage({webPage, combinedBlockTree, blockRefs}));
}

function waitUntiSaveButtonHasRunQueuedOps() {
    return new Promise(resolve => {
        observeStore(selectOpQueue, ops => {
            if (ops.length === 0) resolve();
        });
    });
}

/**
 * @param {RawBlock} blockRaw
 * @param {String} childHtml = ''
 * @returns {String}
 */
function renderBlock(blockRaw, childHtml = '') {
    const blockType = blockTypes.get(blockRaw.type);
    return blockUtils.decorateWithRef(blockRaw, blockType.reRender(blockRaw, () => childHtml));
}

export {createTestState, renderMockEditAppIntoDom, simulatePageLoad,
        waitUntiSaveButtonHasRunQueuedOps, mockPageTypes, testBlocks,
        renderBlock};
