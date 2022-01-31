import * as commons from '@sivujetti-commons-for-edit-app';
import testUtils from './my-test-utils.js';
import * as appTestUtils from './edit-app-testutils.js';
import {simulatePlaceholderPageLoad, clickSubmitButton} from './utils/create-stuff-test-utils.js';

QUnit.module('CreatePageTypeMainPanelView', () => {
    QUnit.test('user can create page type', assert => {
        const done = assert.async();
        const s = createTestState();
        simulateHttpToReturnSuccesfully(s);
        appTestUtils.renderMockEditAppIntoDom('CreatePageTypeView', _cmp =>
            simulatePlaceholderPageLoad(true)
        )
        .then(() =>
            fillBasicInfoInputs(s)
        )
        .then(() =>
            clickConfirmCreatePageTypeButton(s)
        )
        .then(() => {
            verifySavedPageToBacked(s, assert);
            s.httpPostStub.restore();
            done();
        });
    });
    function createTestState() {
        return Object.assign(appTestUtils.createTestState(), {
            testInput: {
                name: 'Products',
                friendlyName: 'Product',
                friendlyNamePlural: 'Products',
                description: '...',
                slug: 'products',
            },
            httpPostStub: null,
        });
    }
    function simulateHttpToReturnSuccesfully(s) {
        s.httpPostStub = window.sinon.stub(commons.http, 'post')
            .returns(Promise.resolve({ok: 'ok'}));
    }
    function fillBasicInfoInputs({testInput}) {
        return new Promise(resolve => {
            testUtils.fillInput(testInput.name, document.querySelector('input[name="name"]'));
            testUtils.fillInput(testInput.friendlyName, document.querySelector('input[name="friendlyName"]'));
            testUtils.fillInput(testInput.friendlyNamePlural, document.querySelector('input[name="friendlyNamePlural"]'));
            testUtils.fillInput(testInput.description, document.querySelector('textarea[name="description"]'));
            // Ignore isListable
            // Ignore defaultLayoutId
            testUtils.fillInput(testInput.slug, document.querySelector('input[name="slug"]'));
            resolve();
        });
    }
    function clickConfirmCreatePageTypeButton(_s) {
        return clickSubmitButton();
    }
    function verifySavedPageToBacked(s, assert) {
        assert.ok(s.httpPostStub.called);
        const expectedCall = s.httpPostStub.getCall(0);
        assert.ok(expectedCall !== null, 'Should save page to backend');
        assert.equal(expectedCall.args[0], '/api/page-types/Draft');
        const data = expectedCall.args[1];
        assert.equal(data.name, s.testInput.name);
        assert.equal(data.friendlyName, s.testInput.friendlyName);
        assert.equal(data.friendlyNamePlural, s.testInput.friendlyNamePlural);
        assert.equal(data.description, s.testInput.description);
        assert.equal(data.slug, s.testInput.slug);
        assert.equal(data.defaultLayoutId, '1');
        // status irrelevant
        assert.equal(data.isListable, true);
        assert.equal(data.blockFields.length, 1);
        assert.deepEqual(data.defaultFields, {title: {defaultValue: 'Title'}});
        assert.equal(data.ownFields.length, 1);
    }
});
