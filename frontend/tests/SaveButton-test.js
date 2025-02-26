import {api, blockTreeUtils, http, objectUtils, writeBlockProps} from '@sivujetti-commons-for-edit-app';
import GlobalBlockTreesRepo from '../edit-app/includes/global-block-trees-repo.js';
import SaveButton from '../edit-app/menu-column/SaveButton.js';
import {registerUpdateSyncedGbtsPatchers} from '../edit-app/menu-column/SaveButtonFuncs.js';
import {Http} from '@sivujetti-commons-for-web-pages';
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
        saveButton.initChannel('globalBlockTrees', []);

        const initialState = createTestTheBlockTreeState('Lorem ipsum');
        saveButton.initChannel('theBlockTree', initialState);
        const userCtx = {event: 'update-single-block-prop', blockId: initialState[0].id};

        const finalNonThrottled = simulateThrottledTyping(initialState, userCtx, saveButton);

        assert.equal(saveButton.states['theBlockTree'].length, 2, 'Should clear throttled items');
        assert.deepEqual(saveButton.states['theBlockTree'].at(-1), finalNonThrottled, 'Should only pick latest item');
        assert.deepEqual(saveButton.states['theBlockTree'].at(-2), initialState);

        //

        function simulateThrottledTyping(initialState, userCtx, saveButton) {
            const throttled1 = blockTreeUtils.createMutation(initialState, copy => {
                writeBlockProps(copy[0], {html: 'Lorem ipsum,'});
            });
            saveButton.pushOp('theBlockTree', throttled1, {...userCtx}, 'is-throttled');

            const throttled2 = blockTreeUtils.createMutation(throttled1, copy => {
                writeBlockProps(copy[0], {html: 'Lorem ipsum, d'});
            });
            saveButton.pushOp('theBlockTree', throttled2, {...userCtx}, 'is-throttled');

            const throttled3 = blockTreeUtils.createMutation(throttled2, copy => {
                writeBlockProps(copy[0], {html: 'Lorem ipsum, do'});
            });
            saveButton.pushOp('theBlockTree', throttled3, {...userCtx}, 'is-throttled');

            const finalNonThrottled = blockTreeUtils.createMutation(throttled3, copy => {
                writeBlockProps(copy[0], {html: 'Lorem ipsum, do.'});
            });
            saveButton.pushOp('theBlockTree', finalNonThrottled, {...userCtx}, null);

            return finalNonThrottled;
        }
    });
    QUnit.test('\'globalBlockTrees\' channel gets wiped after sync', async assert => {
        const state = {gbtsSyncedToBackend: [], httpStub: null};
        simulatePageLoad(state);
        simulateGlobalBlockChange(state);
        stubHttpToReturnSuccesfully(state, 'put');
        await simulateSaveButtonClick();
        verifyGlobalBlockTreesStateGotWiped(assert);
        state.httpStub.restore();

        //

        function simulatePageLoad(state) {
            saveButton.initChannel('globalBlockTrees', []);
            blockTreeUtils.globalBlockTreesRepo = new GlobalBlockTreesRepo;
            state.gbtsSyncedToBackend = [{id: 'a', dataProp: 1}];
            // @ts-ignore
            blockTreeUtils.globalBlockTreesRepo.setTrees(state.gbtsSyncedToBackend);
        }
        function simulateGlobalBlockChange(state) {
            const secondState = [{...state.gbtsSyncedToBackend[0], dataProp: 2}]; // same as createGbtsState()
            saveButton.pushOp(
                'globalBlockTrees',
                secondState,
                {event: 'update-block-in', blockId: 'b'}
            );
        }
        function verifyGlobalBlockTreesStateGotWiped(assert) {
            assert.deepEqual(saveButton.getChannelState('globalBlockTrees'), []);
        }
    });
    QUnit.test('registerUpdateSyncedGbtsPatchers() adds non-synced gbts to gbtsRepo after save', async assert => {
        const state = {gbtsSyncedToBackend: [], httpStub: null};
        simulatePageLoad(state);
        const unreg = registerUpdateSyncedGbtsPatchers(saveButton);
        simulateGlobalBlockAddition(state);
        stubHttpToReturnSuccesfully(state, 'post');
        await simulateSaveButtonClick();
        verifyNewGbtWasAddedToGlobalBlockTreesRepo(assert, state);
        state.httpStub.restore();
        unreg[0]();
        unreg[1]();

        //

        function simulatePageLoad(state) {
            saveButton.initChannel('globalBlockTrees', []);
            blockTreeUtils.globalBlockTreesRepo = new GlobalBlockTreesRepo;
            state.gbtsSyncedToBackend = [{id: 'a', dataProp: 1}];
            // @ts-ignore
            blockTreeUtils.globalBlockTreesRepo.setTrees(state.gbtsSyncedToBackend);
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
        function verifyNewGbtWasAddedToGlobalBlockTreesRepo(assert, state) {
            assert.deepEqual(
                blockTreeUtils.globalBlockTreesRepo.getTrees(),
                [state.gbtsSyncedToBackend[0], state.secondState[1]]
            );
        }
    });
    QUnit.test('partiallyReset() clears single operation that was before the failed operation', async assert => {
        const state = {gbtsSyncedToBackend: [], gbtStates: [], blockTreeStates: [], httpPostStub: null, httpPutStub: null};
        simulatePageLoad(state);

        simulateGlobalBlockAddition(state); // Valid
        simulateBlockUpdate(state);         // Erroneous
        stubHttpToReturnValidationErrorForBlockTreeSave(state);

        await simulateSaveButtonClick();

        assert.deepEqual(saveButton.getChannelState('globalBlockTrees'), [],
            'Should clear "globalBlockTrees" channel\'s state');
        assert.deepEqual(saveButton.getChannelState('theBlockTree'), [...state.blockTreeStates.at(-1)],
            'Should keep "theBlockTree" channel\'s state');

        const info = debug(saveButton);
        assert.equal(info.opHistory.length, 1);
        assert.equal(info.opHistoryCursor, 1);

        state.httpPostStub.restore();
        state.httpPutStub.restore();
    });
    QUnit.test('partiallyReset() clears multiple operations that were before the failed operation', async assert => {
        const state = {gbtsSyncedToBackend: [], blockTreeStates: [], gbtStates: [], httpPostStub: null, httpPutStub: null};
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

        assert.deepEqual(saveButton.getChannelState('globalBlockTrees'), [],
            'Should clear "globalBlockTrees" channel\'s state');
        assert.deepEqual(saveButton.getChannelState('theBlockTree'), [...state.blockTreeStates.at(-1)],
            'Should keep "theBlockTree" channel\'s state');

        const info = debug(saveButton);
        assert.equal(info.opHistory.length, 1);
        assert.equal(info.opHistoryCursor, 1);

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
        saveButton.initChannel('globalBlockTrees', []);
        blockTreeUtils.globalBlockTreesRepo = new GlobalBlockTreesRepo;
        state.gbtsSyncedToBackend = [{id: 'a', dataProp: 1}];
        blockTreeUtils.globalBlockTreesRepo.setTrees(state.gbtsSyncedToBackend);

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
    function simulateBlockUpdate(state) {
        state.blockTreeStates.push(blockTreeUtils.createMutation(state.blockTreeStates.at(-1), copy => {
            writeBlockProps(copy[0], {html: 'not-relevant' + (Date.now())});
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
 * }} saveButton
 */
function debug(saveButton) {
    return {
        opHistory: objectUtils.cloneDeep(saveButton.opHistory),
        opHistoryCursor: saveButton.opHistoryCursor,
        states: objectUtils.cloneDeep(saveButton.states),
        stateCursors: {...saveButton.stateCursors}
    }
}

