import {api} from '@sivujetti-commons-for-edit-app';
import reactTestUtils, {blockUtils} from './my-test-utils.js';
import store, {observeStore, setCurrentPage, selectOpQueue} from '../../edit-app/src/store.js';
import AddPageMainPanelView from '../../edit-app/src/AddPageMainPanelView.jsx';
import CreatePageTypeMainPanelView from '../../edit-app/src/CreatePageTypeMainPanelView.jsx';
import BlockTrees from '../../edit-app/src/BlockTrees.jsx';
import InspectorPanel from '../../edit-app/src/InspectorPanel.jsx';
import SaveButton from '../../edit-app/src/SaveButton.jsx';
import blockTreeUtils from '../../edit-app/src/blockTreeUtils.js';
import EditAppAwareWebPage from '../../webpage/src/EditAppAwareWebPage.js';

const mockPageTypes = [{
    name: 'Pages',
    defaultLayoutId: '1',
    isListable: true,
    ownFields: [{dataType: {type: 'text'}}],
}];
const draftPageType = Object.assign({}, mockPageTypes[0], {
    name: 'Draft',
    defaultFields: {title: {defaultValue: 'Title'}},
});

const testBlocks = [{
    type: 'Paragraph',
    title: '',
    renderer: 'sivujetti:block-auto',
    id: 'EsmAW0--AnViMcwnIaDP',
    children: [],
    propsData: [
        {key: 'text', value: '© Mysite'},
        {key: 'cssClass', value: ''}
    ],
    text: '© Mysite',
    cssClass: ''
}];

function createTestState() {
    return {
        blockTreesCmp: null,
    };
}

const mockEl = document.createElement('div');

class MockEditApp extends preact.Component {
    /**
     * @param {{view: 'DefaultView'|'AddPageView'|'CreatePageTypeView'; pref: preact.Ref;}} props
     */
    render({view, pref}) {
        let viewContent = null;
        if (view === 'AddPageView') viewContent = <AddPageMainPanelView
            pageType={ mockPageTypes[0] }
            ref={ pref }
            blockTreesRef={ preact.createRef() }
            getLayouts={ () => Promise.resolve([{id: '1', friendlyName: 'Default'}]) }
            initialLayoutId='1'
            noAutoFocus/>;
        else if (view === 'CreatePageTypeView') viewContent = <CreatePageTypeMainPanelView
            pageType={ draftPageType }
            ref={ pref }
            blockTreesRef={ preact.createRef() }
            getLayouts={ () => Promise.resolve([{id: '1', friendlyName: 'Default'}]) }
            onPageTypeCreated={ () => {} }/>;
        else viewContent = <BlockTrees
            containingView='DefaultMainPanelView'
            ref={ pref }/>;
        return <>
            <SaveButton/>
            { viewContent }
            <InspectorPanel
                rootEl={ document.getElementById('render-container-el') }
                outerEl={ document.getElementById('render-container-el') }
                mainPanelOuterEl={ mockEl }/>
        </>;
    }
}

function renderMockEditAppIntoDom(view, onCmpReferenced = _cmp => Promise.resolve()) {
    return new Promise(resolve => {
        if (view === 'DefaultView' || view === 'AddPageView' || view === 'CreatePageTypeView')
            reactTestUtils.renderIntoDocument(MockEditApp, {
                view,
                pref: cmp => {
                    if (cmp) onCmpReferenced(cmp).then(() => {
                        resolve(cmp);
                    });
                },
            });
        else
            throw new Error(`View (${view}) must be 'DefaultView', 'AddPageView', or 'CreatePageTypeView'`);
    });
}

function simulatePageLoad(_s, isNewPage = false, testBlocksBundle = 'default', pageType = 'Pages') {
    const pageBlocks = [{
        type: 'PageInfo',
        title: '',
        renderer: 'sivujetti:block-auto',
        id: 'gBPJW0--vD-s3HsG3cu-',
        propsData: [{key: 'overrides', value: '[]'}],
        children: [],
        overrides: '[]',
        parentBlockIdPath: '',
        isStoredTo: 'page'
    }, {
        type: 'Section',
        title: '',
        renderer: 'sivujetti:block-generic-wrapper',
        id: '-MfgGtK5pnuk1s0Kws4u',
        propsData: [
            {key: 'bgImage', value: ''},
            {key: 'cssClass', value: 'initial-section'}
        ],
        bgImage: '',
        cssClass: 'initial-section',
        children: [{
            type: 'Heading',
            title: '',
            renderer: 'sivujetti:block-auto',
            id: '-Me3jYWcEOlLTgJhzqL8',
            children: testBlocksBundle.startsWith('withNestedBlock') ? [{
                type: 'Paragraph',
                title: '',
                renderer: 'sivujetti:block-auto',
                id: '-MlOaY1tZtpkrwPbyuTW',
                children: [],
                propsData: [
                    {key: 'text', value: 'Sub text'},
                    {key: 'level', value: 2},
                    {key: 'cssClass', value: 'subtitle'}
                ],
                text: 'Sub text',
                level: 2,
                cssClass: 'subtitle'
            }] : [],
            propsData: [
                {key: 'text', value: 'My page'},
                {key: 'level', value: 2},
                {key: 'cssClass', value: ''}
            ],
            text: 'My page',
            level: 2,
            cssClass: ''
        }, {
            type: 'Paragraph',
            title: '',
            renderer: 'sivujetti:block-auto',
            id: '-Me3jYWcEOlLTgJhzqLA',
            children: [],
            propsData: [
                {key: 'text', value: 'Hello'},
                {key: 'cssClass', value: ''}
            ],
            text: 'Hello',
            cssClass: ''
        }]
    }].concat(...(testBlocksBundle === 'withGlobalBlockReference' ? [{
        type: 'GlobalBlockReference',
        title: '',
        renderer: 'sivujetti:block-auto',
        id: '-MlPupIvfXCsi7eHeTP4',
        propsData: [{key: 'globalBlockTreeId', value: '10'},
                      {key: 'overrides', value: '{}'},
                      {key: 'useOverrides', value: 0}],
        children: [],
        globalBlockTreeId: '10',
        overrides: '{}',
        useOverrides: 0,
        __globalBlockTree: {
            id: '10',
            name: 'My stored',
            blocks: testBlocks.slice(0),
        },
    }] : []));
    //
    if (testBlocksBundle === 'withNestedBlockReversed')
        pageBlocks[1].children = pageBlocks[1].children.reverse();
    //
    document.getElementById('mock-page-container-el').innerHTML =
        blockUtils.decorateWithRef(pageBlocks[0],
            '<!-- PageInfo dummy -->'
        ) +
        renderBlock(pageBlocks[1], // Section
            renderBlock(pageBlocks[1].children[0], // Heading or Paragraph
                (testBlocksBundle === 'withNestedBlock'
                    ? renderBlock(pageBlocks[1].children[0].children[0])
                    : '')) +
            renderBlock(pageBlocks[1].children[1], // Heading or Paragraph
                (testBlocksBundle === 'withNestedBlockReversed'
                    ? renderBlock(pageBlocks[1].children[1].children[0])
                    : ''))
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
            type: pageType,
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
    return Promise.resolve();
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
    const blockType = api.blockTypes.get(blockRaw.type);
    return blockUtils.decorateWithRef(blockRaw, blockType.reRender(blockRaw, () => childHtml));
}

export {createTestState, renderMockEditAppIntoDom, simulatePageLoad,
        waitUntiSaveButtonHasRunQueuedOps, mockPageTypes, testBlocks,
        renderBlock};
