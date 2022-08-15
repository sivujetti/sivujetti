import {optimizeQueue} from '../edit-app/src/SaveButton.jsx';

const testOps = [
    {opName: 'update-block-tree#2',          command: {args: [], doHandle: function a() {}}},
    {opName: 'update-block-tree#main',       command: {args: [], doHandle: function b() {}}},
    {opName: 'swap-blocks-of-tree#2',        command: {args: [], doHandle: function c() {}}},
    {opName: 'delete-block-from-tree#main',  command: {args: [], doHandle: function d() {}}},
    {opName: 'update-page-basic-info',       command: {args: [], doHandle: function e() {}}},
    {opName: 'update-block-tree#2',          command: {args: [], doHandle: function f() {}}},
    {opName: 'update-page-basic-info',       command: {args: [], doHandle: function g() {}}},
];

QUnit.module('QueueOptimizer', () => {
    QUnit.test('merges similar block update operations', assert => {
        const copy = testOps.slice(0);
        const lastUpdateTree2BlockOp = copy[5];
        const lastUpdateMainTreeBlockOp = copy[3];
        //
        const optimized = optimizeQueue(copy);
        const onlyUpdateBlockOps = getRelevantOperations(optimized, 'updateBlock');
        //
        assert.equal(onlyUpdateBlockOps.length, 2, 'Should eliminate similar operations');
        assert.deepEqual(onlyUpdateBlockOps[0], lastUpdateTree2BlockOp);
        assert.deepEqual(onlyUpdateBlockOps[1], lastUpdateMainTreeBlockOp);
    });
    QUnit.test('merges page basic info update operations', assert => {
        const copy = testOps.slice(0);
        const lastUpdatePageBasicInfoOp = copy[6];
        //
        const optimized = optimizeQueue(copy);
        const onlyUpdateBlockOps = getRelevantOperations(optimized, 'updatePageBasicInfo');
        //
        assert.equal(onlyUpdateBlockOps.length, 1, 'Should eliminate similar operations');
        assert.deepEqual(onlyUpdateBlockOps[0], lastUpdatePageBasicInfoOp);
    });
    function getRelevantOperations(optimized, operations) {
        const filterBy = operations === 'updateBlock'
            ? '-block'
            : '-basic-info';
        return optimized.filter(op => op.opName.indexOf(filterBy) > -1);
    }
});
