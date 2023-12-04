import {__} from '@sivujetti-commons-for-edit-app';
import {SPECIAL_BASE_UNIT_NAME, createUnitClass} from '../edit-app/src/left-column/styles-tabs/styles-tabs-common.js';
import {createAddableUnits, getEnabledUnits, getEditableUnits,
        createAddUnitsDropdownList} from '../edit-app/src/left-column/styles-tabs/widget-based-tab-funcs.js';

QUnit.module('styles-tabs-common.js, widget-based-tab-funcs.js', () => {
    QUnit.test('getEnabledUnits("Section") only returns default units if block has no styles enabled', assert => {
        const testUnits = getTestStyles('Section');
        const testBlock = {id: 'mock-id-1', type: 'Section', styleClasses: ''};
        const result = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock);
        assert.deepEqual(result, [testUnits.ofBody[0], testUnits.ofBody[1]], 'styleClasses=""');
        //
        const testBlock2 = {...testBlock, ...{styleClasses: 'not-unit-class'}};
        const result2 = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock2);
        assert.deepEqual(result2, [testUnits.ofBody[0], testUnits.ofBody[1]], 'styleClasses=""');
    });
    QUnit.test('getEnabledUnits("Section") only returns enabled units', assert => {
        const {testUnits, derived1, derived2, masterUnit} = createSectionTestData();
        const testBlock = {id: 'mock-id-1', type: 'Section', styleClasses: createClasses('Section', masterUnit, derived1)};
        const result = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock);
        assert.deepEqual(result, [testUnits.ofBody[0], testUnits.ofBody[1], derived1], '1');
        //
        const testBlock2 = {...testBlock, ...{styleClasses: createClasses('Section', masterUnit, derived1, masterUnit, derived2)}};
        const result2 = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock2);
        assert.deepEqual(result2, [testUnits.ofBody[0], testUnits.ofBody[1], derived1, derived2], '2');
    });
    QUnit.test('getEnabledUnits("Button") only returns enabled units', assert => {
        const testUnits = getTestStyles('Button');
        const derived1 = testUnits.ofThisBlockType[1];
        const testBlock = {id: 'mock-id-1', type: 'Button', styleClasses: createClasses('Button', derived1)};
        const result = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock);
        assert.deepEqual(result, [testUnits.ofBody[0], derived1], '1');
        //
        const derived2 = testUnits.ofThisBlockType[2];
        const testBlock2 = {...testBlock, ...{styleClasses: createClasses('Button', derived1, derived2)}};
        const result2 = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock2);
        assert.deepEqual(result2, [testUnits.ofBody[0], derived1, derived2], '2');
    });
    QUnit.test('getEnabledUnits("Button") only returns default units if block has no styles enabled', assert => {
        const testUnits = getTestStyles('Button');
        const testBlock = {id: 'mock-id-1', type: 'Button', styleClasses: ''};
        const result = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock);
        assert.deepEqual(result, [testUnits.ofBody[0]], 'styleClasses=""');
        //
        const testBlock2 = {...testBlock, ...{styleClasses: 'not-unit-class'}};
        const result2 = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock2);
        assert.deepEqual(result2, [testUnits.ofBody[0]], 'styleClasses=""');
    });

    QUnit.test('createEditableUnits(userCanEditCss=false) for "Section" includes units that can be edited by user', assert => {
        const {testUnits, testBlock, derived1, derived2} = createSectionTestData();
        const unitsEnabled = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock);
        const userCanEditCss = false;
        const result = getEditableUnits(unitsEnabled, userCanEditCss);
        assert.deepEqual(result, [], '1');
        //
        const testBlock2 = {...testBlock, ...{styleClasses: createClasses('Section', derived1)}};
        const unitsEnabled2 = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock2);
        const result2 = getEditableUnits(unitsEnabled2, userCanEditCss);
        assert.deepEqual(result2, [derived1], '2');
        //
        const testBlock3 = {...testBlock, ...{styleClasses: createClasses('Section', derived1, derived2)}};
        const unitsEnabled3 = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock3);
        const result3 = getEditableUnits(unitsEnabled3, userCanEditCss);
        assert.deepEqual(result3, [derived1, derived2], '3');
    });
    QUnit.test('createEditableUnits(userCanEditCss=false) for "Button" includes units that can be edited by user', assert => {
        const {testUnits, testBlock, derived1, derived2} = createButtonTestData();
        const unitsEnabled = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock);
        const userCanEditCss = false;
        const result = getEditableUnits(unitsEnabled, userCanEditCss);
        assert.deepEqual(result, [], '1');
        //
        const testBlock2 = {...testBlock, ...{styleClasses: createClasses('Button', derived1)}};
        const unitsEnabled2 = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock2);
        const result2 = getEditableUnits(unitsEnabled2, userCanEditCss);
        assert.deepEqual(result2, [derived1], '2');
        //
        const testBlock3 = {...testBlock, ...{styleClasses: createClasses('Button', derived1, derived2)}};
        const unitsEnabled3 = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock3);
        const result3 = getEditableUnits(unitsEnabled3, userCanEditCss);
        assert.deepEqual(result3, [derived1, derived2], '3');
    });
    QUnit.test('createEditableUnits(userCanEditCss=true) for "Button" also includes default units', assert => {
        const {testUnits, testBlock, masterUnit} = createButtonTestData();
        const unitsEnabled = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock);
        const userCanEditCss = true;
        const result = getEditableUnits(unitsEnabled, userCanEditCss);
        assert.deepEqual(result, [masterUnit], '1');
    });

    QUnit.test('createAddableUnits(userCanEditCss=false) for "Section" includes units that can be added and aren\'t already enabled', assert => {
        const {testUnits, testBlock, derived1, derived2, masterUnit} = createSectionTestData();
        const testBlockThis = {...testBlock, ...{styleClasses: createClasses('Section', derived1)}};
        const unitsEnabled = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlockThis);
        const userCanEditCss = false;
        const [instantiable, reference] = createAddableUnits(testUnits.ofThisBlockType, unitsEnabled, 'Section', userCanEditCss);
        assert.deepEqual(instantiable, [
            masterUnit // can be instantiated again
        ]);
        assert.deepEqual(reference, [
            // derived1 is already enabled
            derived2,
        ]);
    });
    QUnit.test('createAddableUnits(userCanEditCss=false) for "Button" includes units that can be added and aren\'t already enabled', assert => {
        const {testUnits, testBlock, derived1, derived2, masterUnit} = createButtonTestData();
        const unitsEnabled = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock);
        const userCanEditCss = false;
        const [instantiable, reference] = createAddableUnits(testUnits.ofThisBlockType, unitsEnabled, 'Button', userCanEditCss);
        assert.deepEqual(instantiable, [
            masterUnit // can be instantiated again
        ]);
        assert.deepEqual(reference, [
            derived1,
            derived2,
        ]);
    });

    QUnit.test('createAddUnitsDropdownList(userCanEditCss=false) for "Section"', assert => {
        const {testUnits, testBlock, derived1, derived2, masterUnit} = createSectionTestData();
        const unitsEnabled = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock);
        const userCanEditCss = false;
        const addable = createAddableUnits(testUnits.ofThisBlockType, unitsEnabled, 'Section', userCanEditCss);
        const result = createAddUnitsDropdownList(addable);
        assert.equal(result.length, 4);
        assert.deepEqual(result[0], {value: masterUnit.id, label: createLabel(masterUnit, 'create clone')}, '[0]');
        assert.deepEqual(result[1], {value: '-', label: '---'}, '[1]');
        assert.deepEqual(result[2], {value: derived1.id, label: createLabel(derived1, 'reuse')}, '[2]');
        assert.deepEqual(result[3], {value: derived2.id, label: createLabel(derived2, 'reuse')}, '[3]');
    });
    QUnit.test('createAddUnitsDropdownList(userCanEditCss=false) for "Button"', assert => {
        const {testUnits, testBlock, derived1, derived2, masterUnit} = createButtonTestData();
        const userCanEditCss = false;
        const unitsEnabled = getEnabledUnits(testUnits.ofThisBlockType, testUnits.ofBody, testBlock);
        const addable = createAddableUnits(testUnits.ofThisBlockType, unitsEnabled, 'Button', userCanEditCss);
        const result = createAddUnitsDropdownList(addable);
        assert.equal(result.length, 4);
        assert.deepEqual(result[0], {value: masterUnit.id, label: createLabel(masterUnit, 'create clone')}, '[0]');
        assert.deepEqual(result[1], {value: '-', label: '---'}, '[1]');
        assert.deepEqual(result[2], {value: derived1.id, label: createLabel(derived1, 'reuse')}, '[2]');
        assert.deepEqual(result[3], {value: derived2.id, label: createLabel(derived2, 'reuse')}, '[3]');
    });

    function createSectionTestData() {
        const testUnits = getTestStyles('Section');
        const derived1 = testUnits.ofThisBlockType[3];
        const derived2 = testUnits.ofThisBlockType[4];
        const masterUnit = testUnits.ofThisBlockType[2];
        const testBlock = {id: 'mock-id-1', type: 'Section', styleClasses: ''};
        return {testUnits, testBlock, derived1, derived2, masterUnit};
    }
    function createButtonTestData() {
        const testUnits = getTestStyles('Button');
        const derived1 = testUnits.ofThisBlockType[1];
        const derived2 = testUnits.ofThisBlockType[2];
        const masterUnit = testUnits.ofBody[0];
        const testBlock = {id: 'mock-id-1', type: 'Button', styleClasses: ''};
        return {testUnits, testBlock, derived1, derived2, masterUnit};
    }
});

/**
 * @param {String} blockTypeName
 * @returns {{ofThisBlockType: Array<ThemeStyleUnit>; ofBody: Array<ThemeStyleUnit>;}}
 */
function getTestStyles(blockTypeName) {
    return blockTypeName === 'Section'
        ? {ofThisBlockType: [
            createUnit({title: '', isDerivable: false, id: 'unit-101', derivedFrom: null, origin: SPECIAL_BASE_UNIT_NAME}),
            createUnit({title: '', isDerivable: false, id: 'unit-102', derivedFrom: null, origin: SPECIAL_BASE_UNIT_NAME}),
            createUnit({title: 'Base template', isDerivable: true, id: 'unit-103', derivedFrom: null}),
            createUnit({title: 'My derived', isDerivable: false, id: 'd-104', derivedFrom: 'unit-103'}),
            createUnit({title: 'My derived 2', isDerivable: false, id: 'd-105', derivedFrom: 'unit-103'}),
        ], ofBody: [
            createUnit({title: 'Default', isDerivable: false, id: 'j-Section-unit-101', origin: 'Section'}),
            createUnit({title: 'Default (body)', isDerivable: false, id: 'j-Section-unit-102', origin: 'Section'}),
        ]}
        : {ofThisBlockType: [
            createUnit({title: '', isDerivable: false, id: 'unit-101', derivedFrom: null, origin: SPECIAL_BASE_UNIT_NAME}),
            createUnit({title: 'Light', isDerivable: false, id: 'd-102', derivedFrom: 'unit-101'}),
            createUnit({title: 'Primary', isDerivable: false, id: 'd-103', derivedFrom: 'unit-101'}),
        ], ofBody: [
            createUnit({title: 'Base template (default)', isDerivable: true, id: 'j-Button-unit-101', origin: 'Button'}),
        ]};
}

/**
 * @param {{[key: String]: any;}} from
 * @returns {ThemeStyleUnit}
 */
function createUnit(from) {
    return {
        ...{
            title: '',
            id: '',
            scss: '',
            generatedCss: '',
            origin: '',
            specifier: '',
            isDerivable: false,
            derivedFrom: null,
        },
        ...from
    };
}

/**
 * @param {ThemeStyleUnit} unit
 * @param {'create clone'|'reuse'} appendix
 * @returns {String}
 */
function createLabel(unit, appendix) {
    return `${__(unit.title)} (${__(appendix)})`;
}

/**
 * @param {String} blockTypeName
 * @param {Array<ThemeStyleUnit>} ...units
 * @returns {String}
 */
function createClasses(blockTypeName, ...units) {
    return units.map(unit => createUnitClass(unit.id, blockTypeName)).join(' ');
}
