import {mergeGlobalBlockTrees} from '../edit-app/menu-column/SaveButtonFuncs.js';

QUnit.module('SaveButtonFuncs.js.js', () => {
    QUnit.test('mergeGlobalBlockTrees() merges trees', assert => {
        assertNonExistingGbtIsAdded();
        assertManyNonExistingGbtIsAdded();
        assertNonExistingGbtIsAddedToEmptySyncedArr();
        assertSameGbtIsUpdated();
        assertSameGbtIsUpdatedAndNonExistingIsAdded();

        function assertNonExistingGbtIsAdded() {
            const fromBackend = [{id: 'a', dataProp: 1}];
            const state = [{id: 'b', dataProp: 1}];
            const actual = mergeGlobalBlockTrees(fromBackend, state);
            assert.deepEqual(actual, [...fromBackend, ...state]);
        }

        function assertManyNonExistingGbtIsAdded() {
            const fromBackend = [{id: 'a', dataProp: 1}];
            const state = [ {id: 'b', dataProp: 1}, {id: 'c', dataProp: 1}];
            const actual = mergeGlobalBlockTrees(fromBackend, state);
            assert.deepEqual(actual, [...fromBackend, ...state]);
        }

        function assertNonExistingGbtIsAddedToEmptySyncedArr() {
            const fromBackend = [];
            const state = [{id: 'a', dataProp: 1}];
            const actual = mergeGlobalBlockTrees(fromBackend, state);
            assert.deepEqual(actual, state);
        }

        function assertSameGbtIsUpdated() {
            const fromBackend = [{id: 'a', dataProp: 1}];
            const state = [{id: 'a', dataProp: 2}];
            const actual = mergeGlobalBlockTrees(fromBackend, state);
            assert.deepEqual(actual, state);
        }

        function assertSameGbtIsUpdatedAndNonExistingIsAdded() {
            const fromBackend = [{id: 'a', dataProp: 1}, {id: 'b', dataProp: 1}];
            const state = [{id: 'c', dataProp: 1}, {id: 'a', dataProp: 2}];
            const actual = mergeGlobalBlockTrees(fromBackend, state);
            assert.deepEqual(actual, [state[1], fromBackend[1], state[0]]);
        }
    });
});
