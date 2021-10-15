import reactTestUtils, {blockUtils} from './my-test-utils.js';
import store, {observeStore, setCurrentPage, selectOpQueue} from '../edit-app/src/store.js';
import AddPageMainPanelView from '../edit-app/src/AddPageMainPanelView.jsx';
import BlockTrees from '../edit-app/src/BlockTrees.jsx';
import EditAppAwareWebPage from '../webpage/src/EditAppAwareWebPage.js';
import InspectorPanel from '../edit-app/src/InspectorPanel.jsx';
import SaveButton from '../edit-app/src/SaveButton.jsx';
import blockTreeUtils from '../edit-app/src/blockTreeUtils.js';

const mockPageTypes = [{"name": "Pages", "ownFields": [],}];

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
                ? <BlockTrees containingView="DefaultMainPanelView" onWebPageLoadHandled={ onPageLoaded } ref={ pref }/>
                : <AddPageMainPanelView pageType={ mockPageTypes[0] } ref={ pref } blockTreesRef={ preact.createRef() } noAutoFocus/>
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
    //
    const layoutBlocks = [{
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
            {"key": "cssClass", "value": ""}
        ],
        "bgImage": "",
        "cssClass": "",
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
                    {"key": "cssClass", "value": "subtitle"}
                ],
                "text": "Sub text",
                "cssClass": "subtitle"
            }] : [],
            "propsData": [
                {"key": "text", "value": "My page"},
                {"key": "level", "value": "1"},
                {"key": "cssClass", "value": ""}
            ],
            "text": "My page",
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
        "propsData": [{"key": "globalBlockTreeId", "value": "10"}],
        "children": [],
        "globalBlockTreeId": "10",
        "__globalBlockTree": {
            "id": "10",
            "name": "My stored",
            "blocks": [Object.assign({}, layoutBlocks[0], {id: "-MlU72IZ110nBtvXt5sx"})]
        },
    }] : []));
    document.getElementById('mock-page-container-el').innerHTML =
        blockUtils.decorateWithRef(pageBlocks[0],
            '<!-- PageInfo dummy -->'
        ) +
        blockUtils.decorateWithRef(pageBlocks[1], '<section id="initial-section"><div data-block-root>' +
            blockUtils.decorateWithRef(pageBlocks[1].children[0], '<h2>My page' +
                (testBlocksBundle === 'withNestedBlock'
                    ? blockUtils.decorateWithRef(pageBlocks[1].children[0].children[0], '<p>Sub para</p>')
                    : '')
            + '</h2>') +
            blockUtils.decorateWithRef(pageBlocks[1].children[1], '<p>Hello</p>') +
        '</div></section>') +
        blockUtils.decorateWithRef(layoutBlocks[0], '<p>© Mysite</p>') +
        (testBlocksBundle === 'withGlobalBlockReference'
            ? blockUtils.decorateWithRef(pageBlocks[2],
                blockUtils.decorateWithRef(pageBlocks[2].__globalBlockTree.blocks[0], '<p>© Mysite</p>'
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
        layoutBlocks: layoutBlocks,
    };
    const webPage = new EditAppAwareWebPage(mockSivujettiCurrentPageData);
    const blockRefs = webPage.scanBlockRefComments();
    const combinedBlockTree = webPage.getCombinedAndOrderedBlockTree(pageBlocks,
        layoutBlocks, blockRefs, blockTreeUtils);
    store.dispatch(setCurrentPage({webPage, combinedBlockTree, blockRefs}));
}

function waitUntiSaveButtonHasRunQueuedOps() {
    return new Promise(resolve => {
        observeStore(selectOpQueue, ops => {
            if (ops.length === 0) resolve();
        });
    });
}

export {createTestState, renderMockEditAppIntoDom, simulatePageLoad,
        waitUntiSaveButtonHasRunQueuedOps, mockPageTypes};
