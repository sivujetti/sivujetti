import {createReorderedStyles} from '../commons-for-edit-app/ScssWizardFuncs.js';

QUnit.module('ScssWizardFuncs.js', () => {
    QUnit.test('createReorderedStyles() retain positions of other styles', assert => {
        const before = [
            {id: 1, data: null, scope: {kind: 'base-freeform', layer: 'base-styles'}, scss: 'a'},
            {id: 2, data: null, scope: {kind: 'custom-class', layer: 'dev-styles'}, scss: 'b'},
            {id: 3, data: null, scope: {kind: 'custom-class', layer: 'dev-styles'}, scss: 'c'},
        ];
        const orderNew = [3,2];
        const reordered = createReorderedStyles(before, orderNew);
        assert.deepEqual(reordered, [
            before[0],
            before[2],
            before[1],
        ]);

        const before2 = [
            ...before,
            {id: 4, data: null, scope: {kind: 'single-block', layer: 'user-styles', page: '<pushid>:Pages'}, scss: 'd'},
        ];
        const reordered2 = createReorderedStyles(before2, orderNew);
        assert.deepEqual(reordered2, [
            before2[0],
            before2[2],
            before2[1],
            before2[3],
        ]);
    });
});
