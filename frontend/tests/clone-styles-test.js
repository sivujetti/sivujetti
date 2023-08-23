import {createCloneInstructions} from '../edit-app/src/left-column/block/WidgetBasedStylesList.jsx';

QUnit.module('WidgetBasedStylesList.jsx', () => {
    QUnit.test('createCloneInstructions creates instructions how to clone styles', assert => {
        const {affectedBlocks} = getTestDupeInfo();
        const tasks = createCloneInstructions(affectedBlocks);
        assert.deepEqual(tasks[0], {block: affectedBlocks[0], action: {name: 'createUnitFrom', from: 'j-Section-d-16', fromIsCreatedFrom: 'j-Section-unit-15'}}, '[0]');
        assert.deepEqual(tasks[1], {block: affectedBlocks[1], action: {name: 'createUnitFrom', from: 'j-Text-d-2', fromIsCreatedFrom: 'bodyUnit'}}, '[1]');
        assert.deepEqual(tasks[2], {block: affectedBlocks[2], action: {name: 'createUnitFrom', from: 'j-Columns-unit-2', fromIsCreatedFrom: 'customUnit'}}, '[2]');
        assert.deepEqual(tasks[3], {block: affectedBlocks[3], action: {name: 'createUnitFrom', from: 'j-Button-d-4', fromIsCreatedFrom: 'bodyUnit'}}, '[3]');
        assert.deepEqual(tasks[4], {block: affectedBlocks[4], action: {name: 'swapClass', replace: 'j-Button-d-4', with: 'prev'}}, '[4]');
        assert.equal(tasks[5] || null, null); // hd no styles
        assert.equal(tasks[6] || null, null); // hd no styles
    });
});

function getTestDupeInfo() {
    return {
        firstMutatedVarName:'background_Section_u16',
        firstMutatedBlockId:'mock-id-1',
        fromIsCreatedFromalScss:'','fromIsCreatedFromalGeneratedCss':'',
        affectedBlocks: [
            {id: 'mock-id-1',styleClasses:'j-Section-unit-15 j-Section-d-16',type:'Section'},
            {id: 'mock-id-2',styleClasses:'j-Text-d-2',type:'Text'},
            {id: 'mock-id-3',styleClasses:'j-Columns-unit-2',type:'Columns'},
            {id: 'mock-id-4',styleClasses:'j-Button-d-4',type:'Button'},
            {id: 'mock-id-5',styleClasses:'j-Button-d-4',type:'Button'},
            {id: 'mock-id-6',styleClasses:'',type:'JetIconsIcon'},
            {id: 'mock-id-7',styleClasses:'',type:'Button'},
        ]
    };
}