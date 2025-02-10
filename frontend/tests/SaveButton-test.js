import {api, blockTreeUtils, http, writeBlockProps} from '@sivujetti-commons-for-edit-app';
import GlobalBlockTreesRepo from '../edit-app/includes/global-block-trees-repo.js';
import SaveButton from '../edit-app/menu-column/SaveButton.js';
import {registerUpdateSyncedGbtsPatchers} from '../edit-app/menu-column/SaveButtonFuncs.js';

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
        /**
         * 
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
    });
    QUnit.test('\'globalBlockTrees\' channel gets wiped after sync', async assert => {
        const state = {gbtsSyncedToBackend: [], httpStub: null};
        simulatePageLoad(state);
        simulateGlobalBlockChange(state);
        await simulateSaveButtonClick(state, 'put');
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
        await simulateSaveButtonClick(state, 'post');
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
    async function simulateSaveButtonClick(state, httpVerb = 'put') {
        // For PUT|POST "/api/global-block-trees/${arg.id}/blocks"
        state.httpStub = sinon.stub(http, httpVerb).returns(Promise.resolve({ok: 'ok'}));
        await saveButton.syncQueuedOpsToBackend();
    }
});
