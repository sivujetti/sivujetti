import {optimizeQueue} from '../edit-app/src/SaveButton.jsx';

const testOps = [
    {opName: 'update-globalBlockTree-block', command: {args: ['mock-update-globalBlockTree-block-data-1'], doHandle: function () {}}},
    {opName: 'update-page-block',            command: {args: ['mock-update-page-block-data-1'],            doHandle: function () {}}},
    {opName: 'swap-globalBlockTree-blocks',  command: {args: ['mock-update-globalBlockTree-block-data-2'], doHandle: function () {}}},
    {opName: 'delete-page-block',            command: {args: ['mock-update-page-block-data-2'],            doHandle: function () {}}},
    {opName: 'update-page-basic-info',       command: {args: ['mock-page-data-1'],                         doHandle: function () {}}},
    {opName: 'update-globalBlockTree-block', command: {args: ['mock-update-globalBlockTree-block-data-3'], doHandle: function () {}}},
    {opName: 'update-page-basic-info',       command: {args: ['mock-page-data-2'],                         doHandle: function () {}}},
];

QUnit.module('QueueOptimizer', () => {
    QUnit.test('merges similar block update operations', assert => {
        const copy = JSON.parse(JSON.stringify(testOps));
        const lastUpdateLayoutBlockOp = copy.find(o => o.command.args[0] === 'mock-update-globalBlockTree-block-data-3');
        const lastUpdatePageBlockOp = copy.find(o => o.command.args[0] === 'mock-update-page-block-data-2');
        //
        const optimized = optimizeQueue(copy);
        const onlyUpdateBlockOps = getRelevantOperations(optimized, 'updateBlock');
        //
        assert.equal(onlyUpdateBlockOps.length, 2, 'Should eliminate similar operations');
        assert.deepEqual(onlyUpdateBlockOps[0], lastUpdateLayoutBlockOp);
        assert.deepEqual(onlyUpdateBlockOps[1], lastUpdatePageBlockOp);
    });
    QUnit.test('merges page basic info update operations', assert => {
        const copy = JSON.parse(JSON.stringify(testOps));
        const lastUpdatePageBasicInfoOp = copy.find(o => o.command.args[0] === 'mock-page-data-2');
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

