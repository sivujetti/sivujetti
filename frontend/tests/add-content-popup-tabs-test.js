import {mergeGlobalBlockTrees} from '../edit-app/menu-column/block/add-content-popup-tabs.jsx';

QUnit.module('add-content-popup-tabs.js', () => {
    QUnit.test('mergeGlobalBlockTrees() merges trees', assert => {
        assertNonExistingGbtIsAdded();
        assertManyNonExistingGbtIsAdded();
        assertNonExistingGbtIsAddedToEmptyStateArr();
        assertSameGbtIsKept();
        assertSameGbtIsKeptAndNonExistingIsAdded();

        function assertNonExistingGbtIsAdded() {
            const state = [{id: 'b', dataProp: 1}];
            const fromBackend = [{id: 'a', dataProp: 1}];
            const actual = mergeGlobalBlockTrees(state, fromBackend);
            assert.deepEqual(actual, [...fromBackend, ...state]);
        }

        function assertManyNonExistingGbtIsAdded() {
            const state = [{id: 'c', dataProp: 1}];
            const fromBackend = [{id: 'a', dataProp: 1}, {id: 'b', dataProp: 1}];
            const actual = mergeGlobalBlockTrees(state, fromBackend);
            assert.deepEqual(actual, [...fromBackend, ...state]);
        }

        function assertNonExistingGbtIsAddedToEmptyStateArr() {
            const state = [];
            const fromBackend = [{id: 'a', dataProp: 1}];
            const actual = mergeGlobalBlockTrees(state, fromBackend);
            assert.deepEqual(actual, fromBackend);
        }

        function assertSameGbtIsKept() {
            const state = [{id: 'a', dataProp: 2}];
            const fromBackend = [{id: 'a', dataProp: 1}];
            const actual = mergeGlobalBlockTrees(state, fromBackend);
            assert.deepEqual(actual, state);
        }

        function assertSameGbtIsKeptAndNonExistingIsAdded() {
            const state = [{id: 'c', dataProp: 1}, {id: 'a', dataProp: 2}];
            const fromBackend = [{id: 'a', dataProp: 1}, {id: 'b', dataProp: 1}];
            const actual = mergeGlobalBlockTrees(state, fromBackend);
            assert.deepEqual(actual, [fromBackend[1], ...state]);
        }
    });
});
