import {api, blockTreeUtils, http, objectUtils, writeBlockProps} from '@sivujetti-commons-for-edit-app';
import SaveButton from '../edit-app/menu-column/SaveButton.js';
import {registerUpdateSyncedGbtsPatchers} from '../edit-app/menu-column/SaveButtonFuncs.js';
/** @typedef {import('../edit-app/menu-column/SaveButton.js').HistoryItem} HistoryItem */
/** @typedef {import('../edit-app/menu-column/SaveButton.js').state} state */

QUnit.module('SaveButton.jsx', hooks => {
    let saveButton;
    hooks.beforeEach(() => {
        saveButton = new SaveButton();
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
            state.blockTreeStates[1],
            state.blockTreeStates[4],
        ]);
        assert.deepEqual(info.stateCursors['theBlockTree'], 2);
    });
    QUnit.test('registerUpdateSyncedGbtsPatchers() adds non-synced gbts to syncedState after save', async assert => {
        const state = {gbtsSyncedToBackend: [], httpStub: null};
        simulatePageLoad(state);
        const unreg = registerUpdateSyncedGbtsPatchers(saveButton);
        simulateGlobalBlockAddition(state);
        stubHttpToReturnSuccesfully(state, 'post');
        await simulateSaveButtonClick();
        verifyNewGbtWasAddedToSyncedState(assert, state);
        state.httpStub.restore();
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
            ]; // same as createGbtsState()
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
        const state = {gbtsSyncedToBackend: [], gbtStates: [], blockTreeStates: [], httpPostStub: null, httpPutStub: null};
        simulatePageLoad(state);
        const initiallySyncedBlocks = [...debug(saveButton).syncedStates['theBlockTree']];

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
        assert.deepEqual(info.syncedStates['theBlockTree'], initiallySyncedBlocks);

        state.httpPostStub.restore();
        state.httpPutStub.restore();
    });
    QUnit.test('partiallyReset() clears multiple operations that were before the failed operation', async assert => {
        const state = {gbtsSyncedToBackend: [], blockTreeStates: [], gbtStates: [], httpPostStub: null, httpPutStub: null};
        simulatePageLoad(state);
        const initiallySyncedBlocks = [...debug(saveButton).syncedStates['theBlockTree']];

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
        assert.deepEqual(info.syncedStates['theBlockTree'], initiallySyncedBlocks);

        state.httpPostStub.restore();
        state.httpPutStub.restore();
    });
    async function stubHttpToReturnSuccesfully(state, httpVerb = 'put') {
        // For PUT|POST "/api/global-block-trees/${arg.id}/blocks"
        state.httpStub = sinon.stub(http, httpVerb).returns(Promise.resolve({ok: 'ok'}));
    }
    async function simulateSaveButtonClick() {
        await saveButton.syncQueuedOpsToBackend();
    }
    function simulatePageLoad(state) {
        saveButton.initChannel('globalBlockTrees', [{id: 'a', dataProp: 1}]);
        state.blockTreeStates.push(createTestTheBlockTreeState('Lorem ipsum.'));
        saveButton.initChannel('theBlockTree', state.blockTreeStates.at(-1));

        saveButton.initChannel('currentPageData', {
            id: '<pushId1>',
            // title: 'a',
            // slug: 'a',
            // path: 'a',
            type: 'Pages',
            // level: 1,
            // layoutId: '',
            // status: 1,
            // isPlaceholderPage: false,
        });
    }
    function simulateGlobalBlockAddition(state, createGbtState = null) {
        state.gbtStates.push(!createGbtState
            ? [
                {...state.gbtsSyncedToBackend[0]},
                {id: 'b', dataProp: 1}
            ] // same as createGbtsState()
            : createGbtState());
        saveButton.pushOp(
            'globalBlockTrees',
            state.gbtStates.at(-1),
            {event: 'insert-block-at', wasCurrentlySelectedBlock: false}
        );
    }
    function simulateBlockUpdate(state, blockText = null) {
        state.blockTreeStates.push(blockTreeUtils.createMutation(state.blockTreeStates.at(-1), copy => {
            writeBlockProps(copy[0], {html: blockText || ('not-relevant' + (Date.now()))});
        }));
        saveButton.pushOp('theBlockTree', state.blockTreeStates.at(-1), {
            event: 'update-single-block-prop',
            blockId: state.blockTreeStates[0][0].id,
        }, null);
    }
    function stubHttpToReturnValidationErrorForBlockTreeSave(state) {
        // For POST "/api/global-block-trees/${arg.id}/blocks"
        state.httpPostStub = sinon.stub(http, 'post').returns(Promise.resolve({ok: 'ok'}));
        // For PUT "/api/pages/${page.type}/${page.id}/blocks"
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
            "html": text
        }
    ];
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
