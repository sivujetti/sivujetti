import * as commons from '@sivujetti-commons-for-edit-app';
import * as appTestUtils from './utils/edit-app-test-utils.js';
import {simulateChangeParagraphTextInput, verifyUpdatedTextInDom} from './utils/render-blocks-test-utils.js';

QUnit.module('ParagraphBlock', () => {
    QUnit.test('text can be edited and saved to backend', assert => {
        const done = assert.async();
        const s = createTestState();
        simulateHttpToReturnSuccesfully(s);
        appTestUtils.renderMockEditAppIntoDom('DefaultView', cmp => {
            s.blockTreesCmp = cmp;
            return appTestUtils.simulatePageLoad(s);
        })
        .then(() =>
            simulateChangeParagraphTextInput(s)
        )
        .then(() => {
            verifyUpdatedTextInDom(s, assert);
            return clickSaveChangesButton(s);
        })
        .then(() => {
            verifySavedBlockToBacked(s, assert);
            s.httpPutStub.restore();
            done();
        });
    });
    function createTestState() {
        return Object.assign(appTestUtils.createTestState(), {
            httpPutStub: null,
        });
    }
    function simulateHttpToReturnSuccesfully(s) {
        s.httpPutStub = window.sinon.stub(commons.http, 'put')
            .returns(Promise.resolve({ok: 'ok'}));
    }
    function clickSaveChangesButton(_s) {
        const p = appTestUtils.waitUntiSaveButtonHasRunQueuedOps();
        setTimeout(() => {
            document.querySelector('#render-container-el button').click();
        }, 10);
        return p;
    }
    function verifySavedBlockToBacked(s, assert) {
        assert.ok(s.httpPutStub.called);
        const expectedCall = s.httpPutStub.getCall(0);
        assert.ok(expectedCall !== null, 'Should save block to backend');
        assert.equal(expectedCall.args[0], '/api/pages/Pages/1/blocks');
        const paragraphBlockData = expectedCall.args[1].blocks[1].children[1];
        assert.equal(paragraphBlockData.text, 'Updated.');
    }
});
