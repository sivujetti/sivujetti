import {api, blockTreeUtils, http, objectUtils, writeBlockProps} from '@sivujetti-commons-for-edit-app';
import globalData from '../edit-app/includes/globalData.js';
import SaveButton from '../edit-app/menu-column/SaveButton.js';
import {registerSyncedItemsUpdater} from '../edit-app/menu-column/SaveButtonFuncs.js';
/** @typedef {import('../edit-app/menu-column/SaveButton.js').HistoryItem} HistoryItem */
/** @typedef {import('../edit-app/menu-column/SaveButton.js').state} state */

QUnit.module('SaveButton.jsx', hooks => {
    let saveButton;
    let globalDataThemeBefore;
    hooks.beforeEach(() => {
        saveButton = new SaveButton();
        globalDataThemeBefore = objectUtils.cloneDeep(globalData.theme);
        
        api.saveButton = {
            setInstance(cmp) { },
            getInstance() { return saveButton; }
        };
        // @ts-ignore
        saveButton.linkRenderer(new class extends preact.Component {
            resetState() {}
        });
    });
    hooks.afterEach(() => {
        api.saveButton = {};
        globalData.theme = globalDataThemeBefore;
    });
    QUnit.test('pushOp strips "is-throttled" items', assert => {
        [4, 3, 4, 1].forEach(steps => {
            saveButton.initChannel('globalBlockTrees', []);

            const initialState = createTestTheBlockTreeState('Lorem ipsum');
            saveButton.initChannel('theBlockTree', initialState);
            const userCtx = {event: 'update-single-block-prop', blockId: initialState[0].id};

            const finalNonThrottled = simulateThrottledTyping(steps, initialState, userCtx, saveButton);
            const info = debug(saveButton);
            assert.equal(info.states['theBlockTree'].length, 1, 'Should clear throttled items');
            assert.deepEqual(info.states['theBlockTree'].at(-1), finalNonThrottled, 'Should only pick latest item');
            assert.deepEqual(saveButton.getChannelState('theBlockTree'), finalNonThrottled, 'Should return latest item');
            assert.equal(info.opHistoryCursor, 1);
            assert.equal(info.opHistory.length, 1);
            assert.equal(info.opHistory.at(-1).flags, null);
            saveButton.invalidateAll();
        });

        //

        function simulateThrottledTyping(steps, initialState, userCtx, saveButton) {
            return [
                'Lorem ipsum, ',
                'Lorem ipsum, d',
                'Lorem ipsum, do',
                'Lorem ipsum, do.',
            ].slice(0, steps).reduce((prevState, text, i) => {
                const out = blockTreeUtils.createMutation(prevState, copy => {
                    writeBlockProps(copy[0], {html: text});
                });
                saveButton.pushOp('theBlockTree', out, {...userCtx}, i < steps - 1 ? 'is-throttled' : null);
                return out;
            }, initialState);
        }
    });
    QUnit.test('pushOp() ditches previously undone history', assert => {
        const state = {blockTreeStates: [], httpPutStub: null};
        simulatePageLoad(state);

        simulateBlockUpdate(state, 'a');
        simulateBlockUpdate(state, 'b');
        simulateBlockUpdate(state, 'c');

        saveButton.doUndo();
        saveButton.doUndo();

        simulateBlockUpdate(state, 'd');

        const info = debug(saveButton);
        assert.equal(info.opHistory.length, 2, 'Should wipe the old history');
        assert.equal(info.opHistoryCursor, 2, 'Should wipe the old history');
        assert.deepEqual(info.states['theBlockTree'], [
            state.blockTreeStates[0],
            state.blockTreeStates[3],
        ]);
        assert.deepEqual(info.stateCursors['theBlockTree'], 2);
    });
    QUnit.test('registerSyncedItemsUpdater(\'globalBlockTrees\') adds non-synced gbts to syncedState after save', async assert => {
        const state = {gbtsSyncedToBackend: [], httpPostStub: null};
        simulatePageLoad(state);
        const unreg = registerSyncedItemsUpdater('globalBlockTrees', saveButton);
        simulateGlobalBlockAddition(state);
        stubHttpToReturnSuccesfully(state, 'post'); // For POST "/api/global-block-trees/:gbtId/blocks"
        await simulateSaveButtonClick();
        verifyNewGbtWasAddedToSyncedState(assert, state);
        state.httpPostStub.restore();
        unreg[0]();
        unreg[1]();

        //

        function simulatePageLoad(state) {
            state.gbtsSyncedToBackend = [{id: 'a', dataProp: 1}];
            saveButton.initChannel('globalBlockTrees', state.gbtsSyncedToBackend);
        }
        function simulateGlobalBlockAddition(state) {
            state.secondState = [
                {...state.gbtsSyncedToBackend[0]},
                {id: 'b', dataProp: 1}
            ];
            saveButton.pushOp(
                'globalBlockTrees',
                state.secondState,
                {event: 'insert-block-at', wasCurrentlySelectedBlock: false}
            );
        }
        function verifyNewGbtWasAddedToSyncedState(assert, state) {
            assert.deepEqual(
                saveButton.getSyncedState('globalBlockTrees'),
                [state.gbtsSyncedToBackend[0], state.secondState[1]]
            );
        }
    });
    QUnit.test('partiallyReset() clears single operation that was before the failed operation', async assert => {
        const state = createSyncTestState();
        simulatePageLoad(state);

        simulateGlobalBlockAddition(state); // Valid
        simulateBlockUpdate(state);         // Erroneous
        stubHttpToReturnValidationErrorForBlockTreeSave(state);

        await simulateSaveButtonClick();

        const info = debug(saveButton);
        assert.equal(info.opHistory.length, 1);
        assert.equal(info.opHistoryCursor, 1);

        assert.deepEqual(saveButton.getChannelState('globalBlockTrees', false), null,
            'Should clear "globalBlockTrees" channel\'s state');
        assert.deepEqual(saveButton.getChannelState('theBlockTree'), [...state.blockTreeStates.at(-1)],
            'Should keep "theBlockTree" channel\'s state');
        assert.deepEqual(info.states['globalBlockTrees'], []);
        assert.equal(info.stateCursors['globalBlockTrees'], 0);
        assert.deepEqual(info.states['theBlockTree'], [[...state.blockTreeStates.at(-1)]]);
        assert.equal(info.stateCursors['theBlockTree'], 1);
        assert.deepEqual(info.syncedStates['theBlockTree'], state.syncedBlockTree);

        state.httpPostStub.restore();
        state.httpPutStub.restore();
    });
    QUnit.test('partiallyReset() clears multiple operations that were before the failed operation', async assert => {
        const state = createSyncTestState();
        simulatePageLoad(state);

        simulateGlobalBlockAddition(state);         // Valid
        simulateBlockUpdate(state);                 // Valid
        simulateGlobalBlockAddition(state, () => [  // Valid
            ...state.gbtStates.at(-1),
            {id: 'c', dataProp: 1}
        ]);
        simulateBlockUpdate(state);                 // Erroneous

        stubHttpToReturnValidationErrorForBlockTreeSave(state);

        await simulateSaveButtonClick();

        const info = debug(saveButton);
        assert.equal(info.opHistory.length, 1);
        assert.equal(info.opHistoryCursor, 1);

        assert.deepEqual(saveButton.getChannelState('globalBlockTrees', false), null,
            'Should clear "globalBlockTrees" channel\'s state');
        assert.deepEqual(saveButton.getChannelState('theBlockTree'), [...state.blockTreeStates.at(-1)],
            'Should keep "theBlockTree" channel\'s state');
        assert.deepEqual(info.states['globalBlockTrees'], []);
        assert.equal(info.stateCursors['globalBlockTrees'], 0);
        assert.deepEqual(info.states['theBlockTree'], [[...state.blockTreeStates.at(-1)]]);
        assert.equal(info.stateCursors['theBlockTree'], 1);
        assert.deepEqual(info.syncedStates['theBlockTree'], state.syncedBlockTree);

        state.httpPostStub.restore();
        state.httpPutStub.restore();
    });
    QUnit.test('eka syncQueuedOpsToBackend() runs previously failed operation the second time', async assert => {
        const state = createSyncTestState();
        simulatePageLoad(state);

        // -- first attempt ----
        simulateBlockUpdate(state);                 // Erroneous
        simulateGlobalBlockAddition(state);         // Valid

        stubHttpToReturnWithValidationError(state); // For PUT "/api/pages/:pageType/:pageId/blocks"
        stubHttpToReturnSuccesfully(state, 'post'); // For POST "/api/global-block-trees/:gbtId/blocks"
        await simulateSaveButtonClick();

        assert.equal(state.httpPostStub.calledOnce, false);
        // ----

        await wait(1);

        // -- second attempt ----
        simulateBlockUpdate(state);                 // Valid

        state.httpPutStub.restore();
        stubHttpToReturnSuccesfully(state, 'put');  // For PUT "/api/pages/:pageType/:pageId/blocks"
        await simulateSaveButtonClick();

        assert.equal(state.httpPostStub.calledOnce, true);

        state.httpPostStub.restore();
        state.httpPutStub.restore();

        const info = debug(saveButton);
        assert.deepEqual(info.syncedStates['globalBlockTrees'], state.gbtStates.at(-1));
        // ----
    });
    QUnit.test('toka syncQueuedOpsToBackend() runs previously failed operation the second time', async assert => {
        const state = createSyncTestState();
        simulatePageLoad(state);

        // -- first attempt ----
        simulateBlockUpdate(state);                 // Erroneous
        simulateGlobalBlockAddition(state);         // Valid
        simulatePageMetaUpdate(state);              // Valid

        stubHttpToReturnWithValidationError(state); // For PUT "/api/pages/:pageType/:pageId/blocks"
        stubHttpToReturnSuccesfully(state, 'post'); // For POST "/api/global-block-trees/:gbtId/blocks"
        await simulateSaveButtonClick();

        assert.equal(state.httpPutStub.calledOnce, true);
        assert.equal(state.httpPostStub.calledOnce, false);
        // ----

        await wait(1);

        // -- second attempt ----
        simulateBlockUpdate(state);                 // Valid

        state.httpPutStub.restore();
        stubHttpToReturnSuccesfully(state, 'put');  // For PUT "/api/pages/:pageType/:pageId/blocks" and
                                                    // PUT "/api/pages/:pageType/:pageId"
        await simulateSaveButtonClick();

        assert.equal(state.httpPostStub.calledOnce, true);
        assert.equal(state.httpPutStub.calledTwice, true);

        state.httpPostStub.restore();
        state.httpPutStub.restore();

        const info = debug(saveButton);
        assert.deepEqual(info.syncedStates['globalBlockTrees'], state.gbtStates.at(-1));
        assert.deepEqual(saveButton.getChannelState('globalBlockTrees'), state.gbtStates.at(-1));
        assert.deepEqual(saveButton.getChannelState('currentPageData'), state.pageMetaStates.at(-1));
        // ----

        function simulatePageMetaUpdate(state) {
            const page = state.pageMetaStates.length ? state.pageMetaStates.at(-1) : state.syncedPageMeta;
            state.pageMetaStates.push({...page, title: page.title + 'a'});
            saveButton.pushOp(
                'currentPageData',
                state.pageMetaStates.at(-1),
                {event: 'update-basic-info'},
            );
        }
    });
    QUnit.test('kolmas syncQueuedOpsToBackend() runs previously failed operation the second time', async assert => {
        const state = {...createSyncTestState(), /** @type {StylesBundleWithId} */ syncedStyles: null, styleStates: []};
        simulatePageLoadWithStyles(state);

        // -- first attempt ----
        simulateBlockUpdate(state);                 // Erroneous
        simulateGlobalBlockAddition(state);         // Valid
        simulateStyleUpdate(state);                 // Valid

        stubHttpToReturnWithValidationError(state); // For PUT "/api/pages/:pageType/:pageId/blocks"
        stubHttpToReturnSuccesfully(state, 'post'); // For POST "/api/global-block-trees/:gbtId/blocks"

        await simulateSaveButtonClick();

        assert.equal(state.httpPutStub.calledOnce, true);
        assert.equal(state.httpPostStub.calledOnce, false);
        // ----

        await wait(1);

        // -- second attempt ----
        simulateBlockUpdate(state);                // Valid

        state.httpPutStub.restore();
        stubHttpToReturnSuccesfully(state, 'put'); // For PUT "/api/pages/:pageType/:pageId/blocks" and
                                                   // PUT "/api/themes/:themeId/styles/all"
        await simulateSaveButtonClick();

        assert.equal(state.httpPostStub.calledOnce, true);
        assert.equal(state.httpPutStub.calledTwice, true);

        state.httpPostStub.restore();
        state.httpPutStub.restore();

        const info = debug(saveButton);
        assert.deepEqual(info.syncedStates['globalBlockTrees'], state.gbtStates.at(-1));
        assert.deepEqual(saveButton.getChannelState('globalBlockTrees'), state.gbtStates.at(-1));
        assert.deepEqual(saveButton.getChannelState('stylesBundle'), state.styleStates.at(-1));
        // ----

        function simulatePageLoadWithStyles(state) {
            simulatePageLoad(state);
            state.syncedStyles = {
                id: 1,
                cachedCompiledCss: '@layer base-styles {\n:root{\n--foo:1;\n}\n',
                cachedCompiledScreenSizesCssHashes: ['<hash>'],
                styleChunks: [
                    {id: 2, data: null, scope:  {kind: 'base-vars', layer: 'base-styles'}, scss: ':root {\n  --foo: 1;\n}'}
                ],
            };
            state.styleStates.push({...state.syncedStyles});
            saveButton.initChannel('stylesBundle', {...state.syncedStyles}, true);
        }
        function simulateStyleUpdate(state) {
            const prevState = {...state.styleStates.at(-1)};
            const baseVarsStyle = prevState.styleChunks.at(-1);
            state.styleStates.push({
                ...prevState,
                styleChunks: [{...baseVarsStyle, scss: baseVarsStyle.scss.replace('1;', '2;')}],
                cachedCompiledCss: prevState.cachedCompiledCss.replace('1;', '2;'),
                id: prevState.id + 1,
            });
            saveButton.pushOp(
                'stylesBundle',
                {...state.styleStates.at(-1)},
            );
        }
    });
    function stubHttpToReturnSuccesfully(state, httpVerb = 'put') {
        state[httpVerb === 'put' ? 'httpPutStub' : 'httpPostStub'] = sinon.stub(http, httpVerb).returns(Promise.resolve({ok: 'ok'}));
    }
    function stubHttpToReturnWithValidationError(state, httpVerb = 'put') {
        const backendValidationErrors = ['linkTo is not valid'];
        state.httpPutStub = sinon.stub(http, httpVerb).returns(Promise.reject(new Error('400 Bad Request', {
            cause: {
                error: backendValidationErrors,
                response: new Response(JSON.stringify(backendValidationErrors), {status: 400, statusText: '400 Bad Request'}),
            }
        })));
    }
    async function simulateSaveButtonClick() {
        await saveButton.syncQueuedOpsToBackend();
    }
    function simulatePageLoad(state) {
        globalData.theme = {id: '1'}; // missä resetointi?

        state.syncedGbts = [{id: 'a', dataProp: 1}];
        saveButton.initChannel('globalBlockTrees', [...state.syncedGbts]);
        state.syncedBlockTree = createTestTheBlockTreeState('Lorem ipsum.');
        saveButton.initChannel('theBlockTree', [...state.syncedBlockTree]);
        state.syncedPageMeta = {
            id: '<pushId1>',
            title: 'a',
            // slug: 'a',
            // path: 'a',
            type: 'Pages',
            // level: 1,
            // layoutId: '',
            // status: 1,
            // isPlaceholderPage: false,
        };
        saveButton.initChannel('currentPageData', {...state.syncedPageMeta});
    }
    function simulateGlobalBlockAddition(state, createGbtState = null) {
        const prevState = state.gbtStates?.length ? state.gbtStates : state.syncedGbts;
        state.gbtStates.push(!createGbtState
            ? [...prevState, {id: 'b', dataProp: 1}]
            : createGbtState());
        saveButton.pushOp(
            'globalBlockTrees',
            state.gbtStates.at(-1),
            {event: 'insert-block-at', wasCurrentlySelectedBlock: false}
        );
    }
    function simulateBlockUpdate(state, blockText = null) {
        const prevState = state.blockTreeStates?.at(-1) || state.syncedBlockTree;
        state.blockTreeStates.push(blockTreeUtils.createMutation(prevState, copy => {
            writeBlockProps(copy[0], {html: blockText || ('not-relevant' + (Date.now()))});
        }));
        saveButton.pushOp('theBlockTree', state.blockTreeStates.at(-1), {
            event: 'update-single-block-prop',
            blockId: state.blockTreeStates[0][0].id,
        }, null);
    }
    function stubHttpToReturnValidationErrorForBlockTreeSave(state) {
        // For POST "/api/global-block-trees/:gbtId/blocks"
        state.httpPostStub = sinon.stub(http, 'post').returns(Promise.resolve({ok: 'ok'}));
        // For PUT "/api/pages/:pageType/:pageId/blocks"
        const backendValidationErrors = ['linkTo is not valid'];
        state.httpPutStub = sinon.stub(http, 'put').returns(Promise.reject(new Error('400 Bad Request', {
            cause: {
                error: backendValidationErrors,
                response: new Response(JSON.stringify(backendValidationErrors), {status: 400, statusText: '400 Bad Request'}),
            }
        })));
    }
});

/**
 * @param {string} text
 * @returns {Array<Block>}
 */
function createTestTheBlockTreeState(text) {
    return [
        {
            "type": "Text",
            "title": "",
            "renderer": "jsx",
            "id": "ukF8haY0mNj",
            "propsData": [{"key": "html", "value": text}],
            "styleClasses": "",
            "children": [],
            "html": text,
        }
    ];
}

function createSyncTestState() {
    return {
        syncedBlockTree: null,
        syncedGbts: null,
        syncedPageMeta: null,
        blockTreeStates: [],
        gbtStates: [],
        pageMetaStates: [],
        httpPostStub: null,
        httpPutStub: null
    };
}

/**
 * @param {Object & {
 *   opHistory: Array<HistoryItem|Array<HistoryItem>>;
 *   opHistoryCursor: number;
 *   states: {[name: string]: Array<state>;};
 *   stateCursors: {[name: string]: number;};
 *   syncedStates: {[name: string]: any;};
 * }} saveButton
 */
function debug(saveButton) {
    return {
        opHistory: objectUtils.cloneDeep(saveButton.opHistory),
        opHistoryCursor: saveButton.opHistoryCursor,
        states: objectUtils.cloneDeep(saveButton.states),
        stateCursors: {...saveButton.stateCursors},
        syncedStates: objectUtils.cloneDeep(saveButton.syncedStates),
    }
}

/**
 * @param {number} millis
 * @returns {Promise<void>}
 */
function wait(millis) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, millis);
    });
}
